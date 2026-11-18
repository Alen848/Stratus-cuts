import { Component } from 'react';

// Sin esto, cualquier error de render desmonta el árbol entero y el usuario se
// queda mirando un fondo vacío, sin pista de qué pasó ni cómo salir.
//
// El caso que lo motivó: con el traductor de Chrome activo, los nodos de texto
// del DOM quedan reemplazados por <font> y React falla al reordenarlos
// ("Failed to execute 'removeChild' on 'Node'"). Ese error se reconoce y se
// explica aparte, porque la solución la tiene el usuario a mano.
function esErrorDeTraductor(error) {
  const msg = String(error?.message || '');
  return /removeChild|insertBefore/.test(msg) && /not a child|Node/.test(msg);
}

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const porTraductor = esErrorDeTraductor(error);

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '14px', padding: '32px', textAlign: 'center',
        background: 'var(--bg)', color: 'var(--text)',
      }}>
        <div style={{ fontSize: '32px' }}>⚠️</div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
          Se cortó la pantalla
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.6 }}>
          {porTraductor
            ? 'Parece que el navegador está traduciendo la página. Desactivá la traducción (ícono de traducir en la barra de direcciones → "Nunca traducir este sitio") y recargá.'
            : 'Hubo un error inesperado. Recargá la página; si vuelve a pasar, avisale al administrador.'}
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '6px', padding: '9px 18px',
            borderRadius: '8px', border: '1px solid var(--border)',
            background: 'var(--bg-hover)', color: 'var(--text)',
            fontSize: '13px', cursor: 'pointer',
          }}
        >
          Recargar
        </button>

        <details style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <summary style={{ cursor: 'pointer' }}>Detalle técnico</summary>
          <pre style={{
            marginTop: '8px', maxWidth: '90vw', overflowX: 'auto',
            textAlign: 'left', whiteSpace: 'pre-wrap',
          }}>
            {String(error?.message || error)}
          </pre>
        </details>
      </div>
    );
  }
}
