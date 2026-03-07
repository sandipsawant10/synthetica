import React from "react";

const gridSize = 32;

export default function PanicHeatmap({ panicLevels }) {

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, 10px)`,
        gap: "1px"
      }}
    >
      {panicLevels.map((panic, index) => {

        const intensity = Math.floor(panic * 255);

        const color = `rgb(${intensity}, ${50}, ${255 - intensity})`;

        return (
          <div
            key={index}
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: color
            }}
          />
        );
      })}
    </div>
  );
}