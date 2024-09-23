import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Spinner() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a timer to change the loading state after 3 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    // Cleanup the timer when the component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && (
        <div className=" flex items-center space-x-2">
          <span>Loading the model..</span>
          <Loader2
            style={{ textAlign: "center" }}
            className=" spinner h-4 w-4 animate-spin"
          />
        </div>
      )}
    </>
  );
}
