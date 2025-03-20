import styles from './app.module.css';
import { Router } from '../router';

export function App() {
  return (
    <div className={styles.app}>
      <Router />
    </div>
  );
}

export default App;
