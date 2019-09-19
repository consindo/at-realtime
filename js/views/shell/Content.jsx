import React from 'react'
import PropTypes from 'prop-types'
import { View, StyleSheet } from 'react-native'
import { withRouter, Route } from 'react-router-dom'

import Switch from './Switch.jsx'

import Events from '../../stores/Events'
import Station from '../station/Station.jsx'
import Save from '../station/Save.jsx'
import LineList from '../lines/LineList.jsx'
import Line from '../lines/Line.jsx'
import LinePicker from '../lines/LinePicker.jsx'
import Sponsor from '../pages/Sponsor.jsx'
import Region from '../pages/Region.jsx'
import Settings from '../pages/Settings.jsx'
import NoMatch from '../pages/NoMatch.jsx'

import Wrapper from './Wrapper.jsx'
import AllLines from '../lines/AllLines.jsx'
import LineMerge from '../lines/LineMerge.jsx';

const routingEvents = new Events()

let styles

// this is just a nice alias to use in the render in the switch
const wrapFn = Child => props => (
  <Wrapper
    animationAction={props.history.action}
    animationState={props.location.animationState}
  >
    <Child />
  </Wrapper>
)

class Content extends React.Component {
  static propTypes = {
    rootComponent: PropTypes.func,
    history: PropTypes.object,
    location: PropTypes.object,
  }

  state = {
    desktopLayout: window.innerWidth > 850,
  }

  triggerStateUpdate = state => data => {
    const { history } = this.props
    const { action } = history
    routingEvents.trigger('animation', data, state, action)
  }

  triggerLayout = () => {
    const { desktopLayout } = this.state
    if (window.innerWidth > 850 && desktopLayout === false) {
      this.setState({
        desktopLayout: true,
      })
    } else if (window.innerWidth <= 850 && desktopLayout === true) {
      this.setState({
        desktopLayout: false,
      })
    }
  }

  render() {
    const { location, rootComponent } = this.props
    const { desktopLayout } = this.state
    return (
      <View
        style={
          desktopLayout
            ? [styles.rootWrapper, styles.desktop]
            : styles.rootWrapper
        }
        onLayout={this.triggerLayout}
      >
        <Switch location={location} key="switch" timeout={400}>
          <Route path="/" exact render={wrapFn(rootComponent)} />
          <Route path="/s/:region/:station" exact render={wrapFn(Station)} />
          <Route path="/s/:region/:station/save" exact render={wrapFn(Save)} />
          <Route path="/l/:region" exact render={wrapFn(LineList)} />
          <Route path="/l/:region/all" exact render={wrapFn(AllLines)} />
          <Route
            path="/l/:region/:agency_id/:route_short_name"
            exact
            render={wrapFn(Line)}
          />
          <Route
            path="/lm/:region/:agency_id/:route_short_name"
            exact
            render={wrapFn(LineMerge)}
          />
          <Route
            path="/l/:region/:agency_id/:route_short_name/picker"
            exact
            render={wrapFn(LinePicker)}
          />
          <Route path="/sponsor" exact render={wrapFn(Sponsor)} />
          <Route path="/region" exact render={wrapFn(Region)} />
          <Route path="/settings" exact render={wrapFn(Settings)} />
          <Route render={wrapFn(NoMatch)} />
        </Switch>
      </View>
    )
  }
}
styles = StyleSheet.create({
  rootWrapper: {
    boxShadow: 'rgba(0,0,0,0.3) 0 0 3px',
    backgroundColor: '#000',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    height: 'calc(100% - 25px)',
  },
  desktop: {
    height: '100%',
  },
})
export default withRouter(Content)
