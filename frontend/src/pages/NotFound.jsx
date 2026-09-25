import { Link } from "react-router-dom";
import { Brand } from "../components/AppLayout";
import { Empty } from "../components/State";
export default function NotFound() {
  return (
    <div className="public-page">
      <Brand />
      <Empty
        icon="search"
        title="This page wandered off."
        message="The address may be incorrect, or the page has moved."
        action={
          <Link className="btn btn--primary" to="/">
            Back to your workspace
          </Link>
        }
      />
    </div>
  );
}
