import { NavLink } from 'react-router-dom';
import { componentRegistry } from '../registry';

export function Sidenav() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">Sefaria React Components</div>
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
        >
          Overview
        </NavLink>

        <div className="nav-section-title">Components</div>
        {componentRegistry.map((config) => (
          <NavLink
            key={config.name}
            to={`/components/${config.name.toLowerCase()}`}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {config.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
