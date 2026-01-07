import { useParams, Navigate } from 'react-router-dom';
import { getComponentByName } from '../registry';
import { ExampleRenderer } from '../components/ExampleRenderer';
import { CodeBlock } from '../components/CodeBlock';

export function ComponentPage() {
  const { componentName } = useParams<{ componentName: string }>();
  const config = componentName ? getComponentByName(componentName) : undefined;

  if (!config) {
    return <Navigate to="/" replace />;
  }

  const Component = config.component;

  return (
    <div className="component-page">
      <header className="component-header">
        <h1>{config.name}</h1>
        <p>{config.description}</p>
      </header>

      <section className="examples-section">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24 }}>
          Examples
        </h2>
        {config.examples.map((example, index) => (
          <ExampleRenderer
            key={index}
            example={example}
            component={Component}
            componentName={config.name}
          />
        ))}
      </section>

      <section className="source-section">
        <h2>Source Code</h2>
        <CodeBlock
          code={config.sourceCode}
          language="tsx"
          filename={`${config.name}.tsx`}
        />
      </section>
    </div>
  );
}
