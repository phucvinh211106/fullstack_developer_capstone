
import React, { useState } from "react";
import "./Register.css";
import Header from "../Header/Header";

const Register = () => {
  const [formData, setFormData] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        window.location.origin + "/djangoapp/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (response.ok && result.status === "Registered") {
        alert("Registration successful!");
        window.location.href = "/login";
      } else {
        setMessage(result.message || "Registration failed.");
      }
    } catch (error) {
      setMessage("Unable to connect to the registration server.");
    }
  };

  return (
    <div>
      <Header />

      <div className="register_container">
        <h1 className="header">Sign-up</h1>

        <form onSubmit={handleRegister}>
          <div className="inputs">
            <input
              className="input_field"
              type="text"
              name="userName"
              placeholder="Username"
              aria-label="Username"
              value={formData.userName}
              onChange={handleChange}
              required
            />

            <input
              className="input_field"
              type="text"
              name="firstName"
              placeholder="First Name"
              aria-label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            <input
              className="input_field"
              type="text"
              name="lastName"
              placeholder="Last Name"
              aria-label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />

            <input
              className="input_field"
              type="email"
              name="email"
              placeholder="Email"
              aria-label="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              className="input_field"
              type="password"
              name="password"
              placeholder="Password"
              aria-label="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          {message && <p role="alert">{message}</p>}

          <div className="submit_panel">
            <button className="submit" type="submit">
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
