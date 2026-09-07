export default function SectionTitle({ eyebrow, title, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 14 }}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="title" dangerouslySetInnerHTML={{ __html: title }} />
    </div>
  );
}
