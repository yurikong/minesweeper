import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom"
import Minesweeper from "./pages/Minesweeper/Minesweeper"
import Undefined from "./pages/Undefined/Undefined"

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/"           exact component={Minesweeper}/>
        <Route path="/undefined"  exact component={Undefined}/>
        <Redirect to="/undefined"/>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
