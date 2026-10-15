import { NavLink } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav aria-label="Main navigation" className="navigation">
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/practice/setup">Practice</NavLink>
      <NavLink to="/statistics">Statistics</NavLink>
      <NavLink to="/settings">Settings</NavLink>
    </nav>
  );
}
