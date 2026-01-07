import { Link } from 'react-router-dom';
import { componentRegistry } from '../registry';

export function HomePage() {
  return (
    <div className="home-page">
      <h1>Sefaria React Component Library</h1>
      <p>
        A collection of reusable React components for Torah apps, powered by Sefaria. Browse the components below or use the sidebar to navigate.
      </p>

      <div className="component-grid">
        {componentRegistry.map((config) => {
          const Component = config.component;
          // Filter out 'ref' to avoid React reserved prop conflict
          const safeProps = config.overviewExample
            ? Object.fromEntries(
                Object.entries(config.overviewExample).filter(([key]) => key !== 'ref')
              )
            : undefined;
          return (
            <Link
              key={config.name}
              to={`/components/${config.name.toLowerCase()}`}
              className="component-card"
            >
              <div className="component-card-header">
                <h3>{config.name}</h3>
                <p>{config.shortDescription || config.description}</p>
              </div>
              {safeProps && (
                <div className="component-card-preview">
                  <Component {...safeProps} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
