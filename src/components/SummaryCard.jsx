import React from "react";

const SummaryCard = ({ title, amount, color }) => {
  return (
    <div className="col-md-2 col-sm-6 mb-3">
      <div
        className="card shadow-sm text-center p-3"
        style={{ borderTop: `4px solid ${color}` }}
      >
        <h6 className="fw-bold">{title}</h6>
        <p className="fs-5 fw-semibold">{amount} €</p>
      </div>
    </div>
  );
};

export default SummaryCard;
