import SectionTitle from "../components/SectionTitle.jsx";
import calendarDefault from "../assets/calendar.jpg";

export default function Calendar({ site }) {
  const img = site && site.calendarImage ? site.calendarImage : calendarDefault;
  return (
    <>
      <SectionTitle eyebrow="Academic year" title="School calendar" />
      <p className="para" style={{ margin: "-6px 0 14px" }}>
        Term dates, holidays and exam windows. Tap the calendar to open it full-size.
      </p>
      <div className="card" style={{ padding: 8 }}>
        <a href={img} target="_blank" rel="noopener noreferrer">
          <img src={img} alt="Academic calendar" style={{ width: "100%", borderRadius: 12, display: "block" }} />
        </a>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--inkSoft)", margin: "10px 2px 0" }}>
        The calendar can be replaced each year by the admin (Content tab).
      </p>
      <div style={{ height: 8 }} />
    </>
  );
}
