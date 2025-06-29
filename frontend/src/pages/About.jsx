import { FaShieldAlt, FaExchangeAlt, FaRocket, FaLink, FaFileAlt, FaLock, FaMobileAlt, FaReact } from "react-icons/fa";
import "./AppFeatures.css";

const features = [
  {
    icon: <FaShieldAlt />,
    title: "Tenant Isolation",
    desc: "Each chat thread is scoped to its tenant, ensuring strict separation of data.",
  },
  {
    icon: <FaExchangeAlt />,
    title: "Structured Templates",
    desc: "Reusable templates ensure consistent communication between SOC teams.",
  },
  {
    icon: <FaRocket />,
    title: "Real-Time Messaging",
    desc: "WebSocket-based updates with typing indicators and read receipts.",
  },
  {
    icon: <FaLink />,
    title: "Incident Linking",
    desc: "Chats are tied to alerts, incidents, and ITSM tickets for full traceability.",
  },
  {
    icon: <FaFileAlt />,
    title: "Tamper-Proof Logs",
    desc: "Messages and files are logged immutably with secure export options.",
  },
  {
    icon: <FaLock />,
    title: "Encrypted Storage",
    desc: "Files are stored with AES encryption to ensure data confidentiality.",
  },
  {
    icon: <FaMobileAlt />,
    title: "Mobile-Ready",
    desc: "React Native parity ensures a seamless experience across devices.",
  },
  {
    icon: <FaReact />,
    title: "Modern Web UI",
    desc: "Vite-powered React frontend for responsive and fast interactions.",
  },
];

export default function About() {
  return (
    <div className="feature-wrapper">
      <h1 className="feature-heading">What Our Chat System Offers</h1>
      <p className="feature-subtitle">
        Built with real-time collaboration, privacy, and scalability at its core.
      </p>

      <div className="feature-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-description">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
