import { Group, Text, useFont } from "@shopify/react-native-skia";
import React from "react";

import { MiniButton, BUTTON_SIZE } from "./MiniButton";
import { ChervronLeft } from "./icons/ChevronLeft";
import { Cog } from "./icons/Cog";
import { useWindowDimensions } from "react-native";


export const Title = ({ title, user }) => {
  const window = useWindowDimensions();
  const font = useFont(require("../../fonts/Comfortaa-Bold.ttf"), 28);
  const font2 = useFont(require("../../fonts/Comfortaa-Bold.ttf"), 14);
  if (!font) {
    return null;
  }
  const titleWidth = font.getTextWidth(title);
  const offsetX = 30 + BUTTON_SIZE;
  const space = 298 - offsetX;
  return (
    <Group transform={[{ translateY: 14 }]}>
      <MiniButton x={-40} y={0}>
        <ChervronLeft />
      </MiniButton>
      <Text
        text={title}
        x={offsetX + (space - titleWidth) / 2}
        y={BUTTON_SIZE - font.getSize()}
        font={font}
        color="white"
      />
      <Text
        text={"user: " + user}
        x={offsetX + (space - titleWidth) / 2 + 3}
        y={BUTTON_SIZE - 10}
        font={font2}
        color="gray"
      />
      <MiniButton x={298} y={0}>
        <Cog />
      </MiniButton>
    </Group>
  );
};