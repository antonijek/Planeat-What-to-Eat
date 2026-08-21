import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useAudioPlayer } from "expo-audio";
import Svg, { Path, G, Circle } from "react-native-svg";
import { Recipe } from "../types";
import { useTranslation } from "react-i18next";
import { useTheme, ThemeColors } from "../constants/theme";

interface Props {
  recipes: Recipe[];
  onSpinEnd: (recipe: Recipe) => void;
  disabled?: boolean;
}

// Velicina platna sa prostorom za klinove koji vire sa oboda (ukupno 300)
const PAD = 20;
const SIZE = 260 + PAD * 2;
const R = 130;
const CX = SIZE / 2;
const CY = SIZE / 2;

// Za vrtnju prstom: prevlačenje po širini ekrana = 1 pun obrtaj.
const SCREEN_W = Dimensions.get("window").width;
const DRAG_DEG = 360; // pun okret za pomeraj = širina ekrana
/** Minimalni "flick" (u st°/s) da točak krene — ispod toga se vraća na granicu. */
const FLICK_MIN_DEG_PER_S = 110;
/** Koliko se najviše okrene od brzine flicka (stepeni). */
const MAX_SWIPE_DEG = 360 * 3;

/** 12 univerzalnih emoji-ja — po jedan na segment, uvek različiti. */
const WHEEL_EMOJIS = [
  "🍗", "🍝", "🥗", "🍳", "🐟", "🍛",
  "🍕", "🍰", "🥩", "🍲", "🥞", "🍪",
];

function polarToCartesian(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
  };
}

function segmentPath(startAngle: number, endAngle: number, r: number) {
  const start = polarToCartesian(r, endAngle);
  const end = polarToCartesian(r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${CX} ${CY} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

/** Ekser ukucan okomito u obod točka — glava se vidi kao mali krug. */
function nailPos(angleDeg: number) {
  return polarToCartesian(R + 2, angleDeg);
}

interface NailProps {
  angle: number;
  headColor: string;
}

interface EmojiLabelProps {
  angle: number;
  emoji: string;
  rotation: SharedValue<number>;
}

/**
 * Emoji koji stoji izvan rotirajućeg točka i prati segment kroz
 * izračunatu poziciju (translate) — na njega se NIKAD ne primenjuje
 * rotacija, pa je uvek uspravan na svim platformama.
 */
function EmojiLabel({ angle, emoji, rotation }: EmojiLabelProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const rad = ((angle + rotation.value - 90) * Math.PI) / 180;
    const x = CX + R * 0.6 * Math.cos(rad);
    const y = CY + R * 0.6 * Math.sin(rad);
    return {
      transform: [{ translateX: x - 20 }, { translateY: y - 20 }],
    };
  });
  return (
    <Animated.View style={[stylesHelper.emoji, animatedStyle]} pointerEvents="none">
      <Text style={stylesHelper.emojiText}>{emoji}</Text>
    </Animated.View>
  );
}

/** Glava eksera ukucanog pod 90° u polje točka — metalna, sa obodom. */
function Nail({ angle, headColor }: NailProps) {
  const pos = nailPos(angle);
  return (
    <G>
      <Circle cx={pos.x} cy={pos.y + 2} r={7} fill="rgba(0,0,0,0.3)" />
      <Circle cx={pos.x} cy={pos.y} r={6} fill="#6B7280" />
      <Circle cx={pos.x} cy={pos.y} r={4.6} fill={headColor} />
      <Circle cx={pos.x - 1.2} cy={pos.y - 1.5} r={2} fill="#A1A1AA" />
      <Circle cx={pos.x - 1.8} cy={pos.y - 2.2} r={0.9} fill="#fff" opacity={0.9} />
    </G>
  );
}

const MAX_SEGMENTS = 12;

/** Statički stilovi za pomoćne komponente van točka (EmojiLabel). */
const stylesHelper = StyleSheet.create({
  emoji: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 26, textAlign: "center" },
});

/** Nasumično bira do MAX_SEGMENTS recepata za točak. */
function pickRandom(recipes: Recipe[], count: number): Recipe[] {
  const arr = [...recipes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

export function Wheel({ recipes, onSpinEnd, disabled }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const rotation = useSharedValue(0);
  const spinning = useSharedValue(0); // 1 dok se vrti, 0 u mirovanju
  const [isSpinning, setIsSpinning] = useState(false);
  const [segments, setSegments] = useState<Recipe[]>([]);
  const tickPlayer = useAudioPlayer(require("../../assets/sounds/tick.wav"));
  const tickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offsetSet = useRef(false);

  // Stanje za vrtnju prstom (UI-thread, bez setState po frame-u).
  const dragStart = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const segmentCount = useSharedValue(0);
  const wheelDisabled = useSharedValue(0);

  useEffect(() => { segmentCount.value = segments.length; }, [segments]);
  useEffect(() => { wheelDisabled.value = disabled ? 1 : 0; }, [disabled]);

  useEffect(() => {
    setSegments(pickRandom(recipes, Math.min(MAX_SEGMENTS, recipes.length)));
  }, [recipes]);

  // Jačina zvuka — ekspo podrazumevano igra tiho, postavljamo na maks.
  useEffect(() => {
    try {
      tickPlayer.volume = 1;
    } catch {
      // tiho ignoriši
    }
  }, [tickPlayer]);

  // Pri prvom učitavanju okreni točak za pola segmenta da pointer
  // odmara na sredini polja (ne na granici sa ekserom).
  useEffect(() => {
    if (segments.length > 0 && !offsetSet.current) {
      offsetSet.current = true;
      rotation.value = -180 / segments.length;
    }
  }, [segments]);

  useEffect(() => {
    return () => {
      if (tickTimeout.current) clearTimeout(tickTimeout.current);
    };
  }, []);

  function playTick() {
    try {
      tickPlayer.volume = 1;
      tickPlayer.seekTo(0);
      tickPlayer.play();
    } catch {
      // tiho ignoriši greške zvuka
    }
  }

  function stopTicks() {
    if (tickTimeout.current) {
      clearTimeout(tickTimeout.current);
      tickTimeout.current = null;
    }
  }

  /**
   * Klikovi tačno sinhronizovani sa okretanjem točka.
   * Izračunava vreme svakog prelaska segmenta preko pointera
   * koristeći inverz od Easing.out(cubic) — istu matematiku kao animacija.
   */
  function scheduleTicks(startAngle: number, targetAngle: number, duration: number) {
    const step = 360 / segments.length;
    const total = targetAngle - startAngle;
    if (total <= 0) return;
    const count = Math.floor(total / step);
    const times: number[] = [];
    for (let i = 1; i <= count; i++) {
      const theta = i * step;
      // inverz od 1-(1-t)^3
      const t = 1 - Math.cbrt(1 - Math.min(1, theta / total));
      const ms = t * duration;
      if (times.length > 0 && ms - times[times.length - 1] < 40) continue; // preskoči preguste
      times.push(ms);
    }
    times.forEach((ms, index) => {
      tickTimeout.current = setTimeout(playTick, ms);
      if (index === times.length - 1) {
        // zadrži poslednji timer da se može očistiti
      }
    });
    playTick();
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Ceo branik se ljulja levo-desno dok se točak vrti: najviše se naginje
  // kad je ekser tačno na vrhu, vraća se na sredini polja.
  const pointerBendStyle = useAnimatedStyle(() => {
    if (spinning.value === 0) return { transform: [{ rotate: "0deg" }] };
    const step = 360 / segments.length;
    const half = step / 2;
    let minDist = half;
    for (let i = 0; i < segments.length; i++) {
      const world = ((step * i + rotation.value) % 360 + 360) % 360;
      const dist = Math.min(world, 360 - world);
      if (dist < minDist) minDist = dist;
    }
    // 0° na sredini polja, maks. ugao kad je ekser tačno na vrhu
    const snap = (1 - minDist / half) * 14;
    return { transform: [{ rotate: `${-snap}deg` }] };
  });

  /** Pokreće animaciju vrtnje od start do target (sa tik zvukom). */
  function runSpinAnimation(start: number, target: number, duration: number) {
    spinning.value = 1;
    scheduleTicks(start, target, duration);
    rotation.value = withTiming(
      target,
      { duration, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(finishSpin)(target % 360);
        }
      }
    );
  }

  function spin() {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);
    const extra = Math.floor(Math.random() * 360 * 5 + 360 * 3); // 3-8 punih krugova
    const start = rotation.value;
    const target = start + extra + 3600;
    runSpinAnimation(start, target, 3000);
  }

  /** Vrtnja inicirana prstom (flick). start = trenutni ugao, spinDeg = koliko da se okrene. */
  function triggerSwipeSpin(start: number, spinDeg: number) {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);
    const target = start + spinDeg;
    // Veći pomak → duže trajanje (da svaki flick ima prirodnu inerciju).
    const dist = Math.abs(target - start);
    const duration = Math.min(2600, Math.max(1100, Math.round(dist * 0.04 + 900)));
    runSpinAnimation(start, target, duration);
  }

  /** Slab pomak (ispod praga flicka): vrati točak na najbližu granicu segmenta bez rezultata. */
  function snapToBoundary() {
    const step = 360 / Math.max(1, segmentCount.value);
    const norm = ((rotation.value % 360) + 360) % 360;
    const nearest = Math.round(norm / step) * step;
    rotation.value = withTiming(rotation.value + (nearest - norm), { duration: 200 });
  }

  // Prepozna pokret prstom po točku; trka na UI thread za glatku vrtnju.
  const swipeGesture = Gesture.Pan()
    .onBegin(() => {
      if (wheelDisabled.value === 1 || spinning.value === 1 || segmentCount.value === 0) return;
      dragStart.value = rotation.value;
      isDragging.value = true;
    })
    .onUpdate((e) => {
      if (!isDragging.value) return;
      rotation.value = dragStart.value + (e.translationX / SCREEN_W) * DRAG_DEG;
    })
    .onEnd((e) => {
      if (!isDragging.value) return;
      isDragging.value = false;
      const degVel = (e.velocityX / SCREEN_W) * DRAG_DEG;
      if (Math.abs(degVel) < FLICK_MIN_DEG_PER_S) {
        runOnJS(snapToBoundary)();
        return;
      }
      const start = rotation.value;
      const deg = Math.sign(degVel) * Math.min(Math.abs(degVel) * 0.45 + 360, MAX_SWIPE_DEG);
      runOnJS(triggerSwipeSpin)(start, deg);
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  function finishSpin(finalRotation: number) {
    stopTicks();
    // poslednji klik tačno kad se točak zaustavi i branik se vrati
    playTick();
    spinning.value = 0;
    setIsSpinning(false);
    const seg = 360 / segments.length;
    // wheel-local ugao koji je tačno na pointeru (0° = vrh)
    const wheelLocal = ((-finalRotation % 360) + 360) % 360;
    const idx = Math.floor(wheelLocal / seg) % segments.length;
    onSpinEnd(segments[idx]);
    // Posle vrtnja — novi nasumični set recepata na točku
    setSegments(pickRandom(recipes, Math.min(MAX_SEGMENTS, recipes.length)));
  }

  return (
    <View style={styles.container}>
      <Animated.View pointerEvents="none" style={[styles.pointerHolder, pointerBendStyle]}>
        <View style={styles.pointerMount}><View style={styles.pointerMountInner} /></View>
        <View style={styles.pointerArm}><View style={styles.pointerArmShadow} /><View style={styles.pointerArmBody} /></View>
      </Animated.View>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.wheel, animatedStyle]}>
          <Svg width={SIZE} height={SIZE}>
            {segments.map((recipe, i) => {
              const start = (360 / segments.length) * i;
              const end = (360 / segments.length) * (i + 1);
              const colour = colors.wheel[i % colors.wheel.length];
              return <G key={recipe.id}><Path d={segmentPath(start, end, R - 2)} fill={colour} /></G>;
            })}
            {segments.map((recipe, i) => {
              const boundary = (360 / segments.length) * i;
              return <Nail key={`nail-${recipe.id}`} angle={boundary} headColor={colors.text} />;
            })}
          </Svg>
          <View style={styles.centerDot}><Text style={styles.centerText}>🍽️</Text></View>
        </Animated.View>
      </GestureDetector>
      {segments.map((recipe, i) => {
        const mid = ((360 / segments.length) * i + (360 / segments.length) * (i + 1)) / 2;
        return <EmojiLabel key={recipe.id} angle={mid} emoji={WHEEL_EMOJIS[i % WHEEL_EMOJIS.length]} rotation={rotation} />;
      })}
      <Pressable style={[styles.spinBtn, disabled && styles.spinBtnDisabled]} onPress={spin} disabled={isSpinning || disabled}>
        <Text style={styles.spinText}>{t("home.spin")}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { alignItems: "center", justifyContent: "center" },
    pointerHolder: {
      position: "absolute",
      top: -24,
      zIndex: 10,
      alignItems: "center",
      justifyContent: "flex-start",
      height: 70,
    },
    pointerMount: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.textMuted,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 6,
      marginBottom: -4,
    },
    pointerMountInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    // Branik — jedan plastični trougao koji se rotira oko vrha.
    pointerArm: {
      alignItems: "center",
    },
    pointerArmShadow: {
      position: "absolute",
      top: 2,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 46,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: "rgba(0,0,0,0.3)",
    },
    pointerArmBody: {
      width: 0,
      height: 0,
      borderLeftWidth: 4.5,
      borderRightWidth: 4.5,
      borderTopWidth: 44,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: "#FFFFFF",
    },
    wheel: { width: SIZE, height: SIZE, marginTop: 12 },
    emoji: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    emojiText: { fontSize: 26, textAlign: "center" },
    centerDot: {
      position: "absolute",
      top: CX - 28,
      left: CY - 28,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    centerText: { fontSize: 26 },
    spinBtn: {
      marginTop: 24,
      backgroundColor: colors.primary,
      paddingHorizontal: 36,
      paddingVertical: 14,
      borderRadius: 30,
      shadowColor: colors.primaryDark,
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    spinBtnDisabled: { backgroundColor: colors.textMuted },
    spinText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
