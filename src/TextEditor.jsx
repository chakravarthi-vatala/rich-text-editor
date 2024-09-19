import { faThumbsDown, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { env, pipeline } from "@xenova/transformers";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useEffect, useRef, useState } from "react";

export default function TextEditor() {
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const classifierRef = useRef(null); // Store the classifier once it's loaded
  let [label, setLabel] = useState([]);
  let [score, setScore] = useState([]);
  const labelColor = label === "POSITIVE" ? "green" : "red";
  const iconToDisplay = label === "POSITIVE" ? faThumbsUp : faThumbsDown;

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        debug: "info",
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"], // Text formatting
            ["link", "image", "video"], // Link, image, video options
            [{ list: "ordered" }, { list: "bullet" }], // Lists
            [{ "code-block": true }], // Code block
            ["clean"], // Clear formatting
          ],
        },
        placeholder: "Type here....",
        theme: "snow",
      });
    }
    document.getElementById("label").style.display = "none";
  }, []);

  useEffect(() => {
    async function loadModel() {
      try {
        console.log("Loading the model, please be patient");
        const classifier = await pipeline(
          "sentiment-analysis",
          "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
        );
        classifierRef.current = classifier; // Store the loaded classifier
      } catch (error) {
        console.error("Error loading the model:", error);
      }
    }

    // Load the model once
    if (!classifierRef.current) {
      loadModel();
    }

    const handleTextChange = async () => {
      setTimeout(async () => {
        const editorContent = quillInstance.current.getText();
        if (classifierRef.current) {
          try {
            const output = await classifierRef.current(editorContent);
            console.log("output", output);
            setLabel(output[0].label);
            setScore(output[0].score);
            document.getElementById("label").style.display = "block";
          } catch (error) {
            console.error("Error classifying text:", error);
          }
        }
      }, 5000);
    };

    if (quillInstance.current) {
      quillInstance.current.on("text-change", handleTextChange);
    }

    // Clean up the event listener
    return () => {
      if (quillInstance.current) {
        quillInstance.current.off("text-change", handleTextChange);
      }
    };
  }, []);

  return (
    <>
      <div ref={editorRef} id="editor" /*style={{ height: "90%" }}*/></div>
      <div id="label">
        <b id="left">
          Label:&nbsp;
          <span id="labelColor" style={{ color: labelColor }}>
            {label}&nbsp;
            <span>
              <FontAwesomeIcon icon={iconToDisplay} />
            </span>
          </span>
        </b>
        <b id="right">
          Confidence:&nbsp;<span>{score}</span>
        </b>
      </div>
    </>
  );
}
