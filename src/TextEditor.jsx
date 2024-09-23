//...................................................................................
import { faThumbsDown, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { env, pipeline } from "@xenova/transformers";
import { Loader2 } from "lucide-react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useEffect, useRef, useState } from "react";

export default function TextEditor() {
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const classifierRef = useRef(null);
  const [label, setLabel] = useState("");
  const [score, setScore] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const labelColor = label === "POSITIVE" ? "green" : "red";
  const iconToDisplay = label === "POSITIVE" ? faThumbsUp : faThumbsDown;

  useEffect(() => {
    async function loadModel() {
      try {
        console.log("Loading the model, please be patient");
        const classifier = await pipeline(
          "sentiment-analysis",
          "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
        );
        classifierRef.current = classifier;
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Error loading the model:", error);
      }
    }

    if (!classifierRef.current) {
      loadModel();
    }
  }, []);

  useEffect(() => {
    if (isModelLoaded && editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        debug: "info",
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            ["link", "image", "video"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ "code-block": true }],
            ["clean"],
          ],
        },
        placeholder: "Type here....",
        theme: "snow",
      });

      const handleTextChange = async () => {
        setTimeout(async () => {
          const editorContent = quillInstance.current.getText();
          if (classifierRef.current) {
            try {
              const output = await classifierRef.current(editorContent);
              setLabel(output[0].label);
              setScore(output[0].score);
              document.getElementById("label").style.display = "block";
            } catch (error) {
              console.error("Error classifying text:", error);
            }
          }
        }, 4000);
      };

      quillInstance.current.on("text-change", handleTextChange);

      return () => {
        if (quillInstance.current) {
          quillInstance.current.off("text-change", handleTextChange);
        }
      };
    }
  }, [isModelLoaded]);

  return (
    <>
      {!isModelLoaded ? (
        <div className="flex items-center justify-center h-screen">
          <h1 className="flex items-center space-x-2 text-xl">
            Loading the model, please wait..
            <Loader2 className="spinner h-6 w-6 animate-spin" />
          </h1>
        </div>
      ) : (
        <>
          <h1
            style={{
              textAlign: "center",
              fontFamily: `'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande',
          'Lucida Sans Unicode', 'Geneva', 'Verdana', 'sans-serif'`,
            }}
          >
            Sentiment Analysis Rich Text Editor
          </h1>

          <div ref={editorRef} id="editor" />
          <div id="label" style={{ display: "none" }}>
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
      )}
    </>
  );
}
