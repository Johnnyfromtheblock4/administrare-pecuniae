import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalendarWidget = () => {
  const [value, setValue] = useState(new Date());

  return (
    <div className="my-5 text-center">
      <h4>Calendario Bollette</h4>
      <div className="d-flex justify-content-center mt-3">
        <Calendar onChange={setValue} value={value} />
      </div>
    </div>
  );
};

export default CalendarWidget;
