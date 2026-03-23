import styles from '../../styles/ui/Input.module.css';

export default function Input({ label, error, ...props }) {
  const fieldClass = `${styles.field} ${error ? styles.fieldError : ''}`;

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}

      {props.as === 'select' ? (
        <select className={fieldClass} style={{ cursor: 'pointer' }} {...{ ...props, as: undefined }}>
          {props.children}
        </select>
      ) : props.as === 'textarea' ? (
        <textarea
          className={fieldClass}
          style={{ resize: 'vertical', minHeight: '80px' }}
          {...{ ...props, as: undefined }}
        />
      ) : (
        <input className={fieldClass} {...props} />
      )}

      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}
