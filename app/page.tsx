import App from "../src/App";
import { ErrorBoundary } from "../src/components/Shared";

export default function Home() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}
