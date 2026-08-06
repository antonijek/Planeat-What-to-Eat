import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { RecipesScreen } from "../screens/RecipesScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { ShoppingScreen } from "../screens/ShoppingScreen";
import { MainTabParamList } from "./types";
import { colors } from "../constants/theme";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
            WheelTab: "dice-multiple",
            RecipesTab: "book-open-variant",
            FavoritesTab: "heart",
            ShoppingTab: "cart-outline",
          };
          return (
            <MaterialCommunityIcons name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="WheelTab" component={HomeScreen} options={{ tabBarLabel: "Wheel" }} />
      <Tab.Screen name="RecipesTab" component={RecipesScreen} options={{ tabBarLabel: "Recipes" }} />
      <Tab.Screen name="FavoritesTab" component={FavoritesScreen} options={{ tabBarLabel: "Favorites" }} />
      <Tab.Screen name="ShoppingTab" component={ShoppingScreen} options={{ tabBarLabel: "Shopping" }} />
    </Tab.Navigator>
  );
}
