import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainTabs } from "./MainTabs";
import { RecipeDetailScreen } from "../screens/RecipeDetailScreen";
import { PremiumScreen } from "../screens/PremiumScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { PlanerScreen } from "../screens/PlanerScreen";
import { MyRecipesScreen } from "../screens/MyRecipesScreen";
import { CalorieLogScreen } from "../screens/CalorieLogScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { RootStackParamList } from "./types";
import { useTheme } from "../constants/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors } = useTheme();
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
    },
  };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={MainTabs} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
        <Stack.Screen name="Premium" component={PremiumScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Planer" component={PlanerScreen} />
        <Stack.Screen name="MyRecipes" component={MyRecipesScreen} />
        <Stack.Screen name="CalorieLog" component={CalorieLogScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
