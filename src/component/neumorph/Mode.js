import {
  BackdropBlur,
  rect,
  rrect,
  Fill,
  RoundedRect,
  Group,
  useImage,
  Image,
  useComputedValue,
} from "@shopify/react-native-skia";
import React from "react";

const clip = rrect(rect(25, 160, 350, 400), 40, 40);


export const Mode = ({ translateY }) => {
  const transform = useComputedValue(
    () => [{ translateY: translateY.current }],
    [translateY]
  );
  const image = useImage(require("../images/settings.png"));
  if (!image) {
    return null;
  }
  return (
    <Group transform={transform}>
      <BackdropBlur blur={40 / 3} clip={clip}>
        <Fill color="rgba(255, 255, 255, 0.1)" />
        <Group>
          <RoundedRect
            rect={clip}
            style="stroke"
            strokeWidth={1}
            color="rgba(200, 200, 200, 0.5)"
          />
        </Group>
      </BackdropBlur>
      <Image image={image} x={0} y={120} width={400} height={200} />
    </Group>
  );
};