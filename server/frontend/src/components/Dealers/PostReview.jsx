
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../Header/Header";

const PostReview = () => {
  const { id } = useParams();

  const [review, setReview] = useState("");
  const [purchase, setPurchase] = useState("yes");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("2022");
  const [makes, setMakes] = useState([]);

  const username = sessionStorage.getItem("username");

  useEffect(() => {
    fetch("/djangoapp/get_cars")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMakes(data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const selectedMake = makes.find(
    (make) => make.name === carMake
  );

  const models = selectedMake?.models || [];

  
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!review.trim()) {
    alert("Please enter your review.");
    return;
  }

  try {
    const response = await fetch("/djangoapp/add_review", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dealership: Number(id),
        review: review.trim(),
        purchase: purchase === "yes",
        purchase_date: purchaseDate,
        car_make: carMake,
        car_model: carModel,
        car_year: Number(carYear)
      })
    });

    const result = await response.json();

    if (response.ok && result.status === 200) {
      alert("Review added successfully!");
      window.location.href = `/dealer/${id}`;
    } else {
      alert(result.error || "Unable to submit review.");
    }
  } catch (error) {
    console.error("Submit review error:", error);
    alert("An error occurred while submitting the review.");
  }
};


  const fieldStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "5px"
  };

  if (!username) {
    return (
      <>
        <Header />
        <div style={{ padding: "30px" }}>
          Please log in before posting a review.
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div style={{
        maxWidth: "650px",
        margin: "30px auto",
        padding: "25px",
        border: "1px solid #ddd",
        borderRadius: "8px"
      }}>
        <h2>Post Review</h2>
        <h4>Dealer ID: {id}</h4>
        <p>Reviewing as: {username}</p>

        <form onSubmit={handleSubmit}>
          <label>Review</label>
          <textarea
            style={{ ...fieldStyle, height: "100px" }}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your review"
            required
          />

          <label>Did you purchase a car?</label>
          <select
            style={fieldStyle}
            value={purchase}
            onChange={(e) => setPurchase(e.target.value)}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <label>Purchase Date</label>
          <input
            type="date"
            style={fieldStyle}
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />

          <label>Car Make</label>
          <select
            style={fieldStyle}
            value={carMake}
            onChange={(e) => {
              setCarMake(e.target.value);
              setCarModel("");
            }}
          >
            <option value="">Select Car Make</option>
            {makes.map((make) => (
              <option key={make.id} value={make.name}>
                {make.name}
              </option>
            ))}
          </select>

          <label>Car Model</label>
          <select
            style={fieldStyle}
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
          >
            <option value="">Select Car Model</option>
            {models.map((model) => (
              <option key={model.id} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>

          <label>Car Year</label>
          <input
            type="number"
            min="2015"
            max="2023"
            style={fieldStyle}
            value={carYear}
            onChange={(e) => setCarYear(e.target.value)}
          />

          <button
            type="submit"
            style={{
              backgroundColor: "#00c5c8",
              padding: "12px 25px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Submit Review
          </button>
        </form>
      </div>
    </>
  );
};

export default PostReview;
