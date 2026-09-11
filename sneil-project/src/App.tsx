import { useState,useEffect } from "react";

const SEGMENT_COUNT = 16;
export default function App() {
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);

  useEffect(() => {
    const handleMouseMove = (e:MouseEvent) => {
      setX(e.clientX);
      setY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection:"column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        fontSize: "2rem",
        fontFamily: "monospace",
        userSelect: "none",
      }}
    >
      <p>X: {x}</p>
      <p>Y: {y}</p>
    </div>
  )
};