import React from "react";

import '../stylesheets/Hero.css';

const HeroSection = () => {
  return (
    <div className="hero-section">
      <div className="banner margin-b-xl">
        <h1>dr.csv</h1>
        <p className="margin-b-xl">Cleanup, Analyze and Sequelize Queries</p>
        <a href="/faq" target="_blank" rel="noopener noreferrer" className="glass-button">Learn More</a>
      </div>
      <div className="description">
        <h3>What We Do</h3>
        <p>
          With dr.csv, we help you effortlessly clean up, fix, and analyze your CSV files.
          Our powerful tool allows you to perform SQL queries and export results with ease,
          making data management simple and efficient.
        </p>
      </div>
    </div>
  )
}

export default HeroSection;
