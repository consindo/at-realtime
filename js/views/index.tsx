import * as React from 'react'
import { Link } from 'react-router'
import { StationStore, StationMap } from '../stores/stationStore.ts'

interface ISidebarButtonProps extends React.Props<SidebarButton> {
  url: string,
  name: string,
  icon: string
}

class SidebarButton extends React.Component<ISidebarButtonProps, {}> {
  public render() {
    var classname
    if (window.location.pathname.split('/')[1] == this.props.url.substring(1)) {
      classname = 'selected'
    }
    return (
      <li className={classname}>
        <Link to={this.props.url}>{this.props.icon}</Link>
      </li>
    )
  }
}

interface IAppProps extends React.Props<Index> {}

class Index extends React.Component<IAppProps, {}> {
  public render() {
    return (
      <div className="panes">
        <nav className="bignav">
          <ul>
            <SidebarButton icon="" name="Home" url="/" />
            <SidebarButton icon="" name="Search" url="/s" />
            <SidebarButton icon="" name="Saved Stations" url="/ss" />
            <SidebarButton icon="" name="Send Feedback" url="/feedback" />
            <SidebarButton icon="" name="Settings" url="/settings" />
          </ul>
        </nav>
        <div className="content">
        {this.props.children}
        </div>
      </div>
    )
  }
}
export default Index