import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ApplicantCoding.css';
import { apiUrl } from '../../services/ApplicantAPIService';
import { useUserContext } from '../common/UserProvider';

const ApplicantCoding = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useUserContext();

  useEffect(() => {
    const fetchQuestions = async () => {
      const token = localStorage.getItem('jwtToken');

      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${apiUrl}/codingQuestions/getAllQuestions/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setQuestions(response.data);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Failed to load questions: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleSolve = (questionId) => {
    console.log(`Solving question with ID: ${questionId}`);
    navigate(`/applicantcompiler/${questionId}`);
  };

  return (
    <div className="container-list">
      <h2>Practice Coding Questions</h2>

      {loading && <p>Loading questions...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && questions.length === 0 && (
        <p>No questions available.</p>
      )}

      {!loading && !error && questions.map((question) => (
        <div key={question.questionNumber} className="card-question">
          <h3 className="card-title">{question.questionName}</h3>
          <button
            className="button-success"
            onClick={() => handleSolve(question.id)}
          >
            Solve
          </button>
        </div>
      ))}
    </div>
  );
};

export default ApplicantCoding;
