import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ApplicantCompiler.css";
import axios from "axios";
import { apiUrl } from "../../services/ApplicantAPIService";
import { useUserContext } from '../common/UserProvider';
import { set } from "react-ga";

const ApplicantCompiler = () => {
  const navigate = useNavigate();
  const { id = 0 } = useParams();
  const { user } = useUserContext();
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(getDefaultCode("java"));
  const [testCases, setTestCases] = useState([]);
  const [visibleInput, setVisibleInput] = useState("");
  const [visibleOutput, setVisibleOutput] = useState("");
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [questionData, setQuestionData] = useState(null);
  const [score, setScore] = useState(null);


  const token = localStorage.getItem("jwtToken");

  useEffect(() => {
    if (id && token) {
      fetchQuestion(id);
    }
  }, [id, token]);

  const fetchQuestion = async (qid) => {
    try {
      const response = await axios.get(
        `${apiUrl}/codingQuestions/getQuestion/${qid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      setQuestionData(data);

      const visibleCase = data.testCases.find(
        (tc) => tc.visibility === "visible"
      );

      const allTestCases = data.testCases.filter(Boolean);
      setTestCases(allTestCases);
      setVisibleInput(visibleCase?.sampleInput || "");
      setVisibleOutput(visibleCase?.expectedOutput || "");
      setOutputs([]);
    } catch (err) {
      console.error("Failed to load question data:", err);
    }
  };

  const handleRunCode = async () => {
    setLoading(true);
    setOutputs([]);

    try {
      const response = await axios.post(
        `${apiUrl}/codingQuestions/execute`,
        {
          language,
          code,
          testCases,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Execution Response:", response.data); // Should log ["120", "350", "0"]

      const result = response.data;

      // Direct array from backend
      setOutputs(Array.isArray(result) ? result : [result]);

    } catch (err) {
      const message = err.response?.data?.message || err.message || "Unknown error";
      setOutputs([`Error: ${message}`]);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    let passCount = 0;

    testCases.forEach((tc, idx) => {
      const expected = normalize(tc.expectedOutput || "");
      const actual = normalize(outputs[idx] || "");
      if (expected === actual) passCount++;
    });

    const total = testCases.length;
    const calculatedScore = Math.round((passCount / total) * 100);
    setScore(calculatedScore);

    const payload = {
      applicantId: user.id, // Replace with dynamic value if needed
      questionId: questionData.id,   // Replace with dynamic value if needed
      code: code,         // Code written by user
      language: language, // Language selected
      score: calculatedScore,
    };

    try {
      await axios.post(
        `${apiUrl}/codingQuestions/submit`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Assuming you're using auth
          },
        }
      );
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error submitting code: " + (error.response?.data?.message || error.message));
    }
  };


  const handleClose = () => {
    navigate("/applicantcoding");
  };

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    setOutputs([]);
    setCode(getDefaultCode(selectedLang));
  };

  const normalize = (text) =>
    (text || "").toString().replace(/\r\n/g, "\n").trim();

  return (
    <div className="compiler-wrapper">
      {/* Left Panel */}
      <div className="compiler-left">
        <div className="compiler-top-buttons">
          <button onClick={handleClose}>Close</button>
        </div>

        {!questionData ? (
          <p>Loading question...</p>
        ) : (
          <>
            <p className="question-name">{questionData.questionName}</p>
            <p className="problem-statement">{questionData.description}</p>
            <p className="complexity">
              <strong>Complexity:</strong> {questionData.complexity}
            </p>
            <p className="constraints">
              <strong>Constraints:</strong> {questionData.constraints}
            </p>
            <div className="test-inputs">
              <strong>Sample Input:</strong> {visibleInput || "N/A"}
            </div>
            <div className="test-inputs">
              <strong>Sample Output:</strong> {visibleOutput || "N/A"}
            </div>
          </>
        )}
      </div>

      {/* Right Panel */}
      <div className="compiler-right">
        <div className="compiler-right-top">
               <div className="language-selector">
          <label htmlFor="language-select" className="language-label">Select Language:</label>
          <select id="language-select" value={language} onChange={handleLanguageChange}>
            <option value="java">Java</option>
            <option value="python">Python</option>
          </select>
        </div>

        <div className="code-editor-section">
          <div className="editor-wrapper">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={language === "java" ? 20 : 15}
              className="code-editor"
              placeholder="Write your code here..."
            />
          </div>
          <div className="compiler-buttons">
            <button
              onClick={handleRunCode}
              disabled={loading}
              className="run-btn"
            >
              {loading ? "Running..." : "Run"}
            </button>
            <button className="submit-btn" onClick={handleSubmit}>Submit</button>
          </div>
        </div>
        </div>
        <div className="output-section">
          {score !== null && (
            <div className="score-box">
              <p>
                <strong>Score:</strong> {score}% ({testCases.length} test cases)
              </p>
            </div>
          )}
          <h2>Outputs:</h2>
          {testCases.length === 0 ? (
            <p>No test cases available.</p>
          ) : outputs.length === 0 ? (
            <p>Output will be displayed below after clicking Run.</p>
          ) : (
            testCases.map((tc, idx) => {
              const expected = normalize(tc.expectedOutput || "");
              const actual = normalize(outputs[idx] || "");
              const matched = expected === actual;
              const isVisible = tc.visibility === "visible"; // assuming "visible" / "hidden"

              return (
                <pre key={idx} className="output-box">
                  <strong style={{ fontSize: "18px" }}>Output {idx + 1}:</strong>
                  <br />
                  {matched ? (
                    <>
                      <div style={{ color: "green", fontWeight: "bold", fontSize: "18px" }}>
                        TestCase - {idx + 1} Passed
                      </div>
                      {isVisible && (
                        <>
                          <div>
                            <strong>Expected:</strong> {expected || "No output"}
                          </div>
                          <div>
                            <strong>Got:</strong> {actual || "No output"}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ color: "red", fontWeight: "bold", fontSize: "18px" }}>
                        TestCase - {idx + 1} Failed
                      </div>
                      {isVisible && (
                        <>
                          <div>
                            <strong>Expected:</strong> {expected || "No output"}
                          </div>
                          <div>
                            <strong>Got:</strong> {"Error occurred while running the code"}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </pre>
              );
            })
          )}

        </div>
      </div>

    </div>
  );
};

// Default code templates
const getDefaultCode = (lang) => {
  return lang === "java"
    ? `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // your code here
    }
}`
    : `# Python starter code
# your code here`;
};

export default ApplicantCompiler;
