import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import local from '../../../local.js'

import UiStore from '../../stores/UiStore.js'
import CurrentLocation from '../../stores/CurrentLocation.js'
import { t } from '../../stores/translationStore.js'

import { vars } from '../../styles.js'
import Header from '../reusable/Header.jsx'
import LinkedScroll from '../reusable/LinkedScroll.jsx'
import LinkButton from '../reusable/LinkButton.jsx'
import Spinner from '../reusable/Spinner.jsx'

// Note! Regions are now dynamically loaded from the server! Yay!
// However, you will need to add the image, the-preifx.jpg in the /photos directory
let styles
class Region extends React.Component {
  state = {
    cities: [],
    data: {},
    loading: true,
  }

  changeCity(city) {
    return () => {
      CurrentLocation.setCity(city, this.state.data[city].initialLocation)
      UiStore.goBack('/')
    }
  }

  componentDidMount() {
    this.getCities()
  }

  getCities = async () => {
    try {
      const response = await fetch(`${local.endpoint}/regions`)
      const data = await response.json()
      const cities = Object.keys(data)
        .filter(city => data[city].showInCityList)
        .sort()
      this.setState({
        cities,
        data,
        loading: false,
      })
    } catch (err) {
      this.setState({ loading: false })
    }
  }

  triggerRetry = () => {
    this.setState({ loading: true })
    this.getCities()
  }

  cityIcon = city => {
    return (
      <TouchableOpacity
        key={city}
        iOSHacks
        activeOpacity={75}
        onPress={this.changeCity(city)}
        style={[styles.region, { backgroundImage: `url(/photos/${city}.jpg)` }]}
      >
        <Text style={[styles.regionText, styles.regionTextHeader]}>
          {this.state.data[city].name}
        </Text>
        <Text style={[styles.regionText, styles.regionTextSubHeader]}>
          {this.state.data[city].secondaryName}
        </Text>
      </TouchableOpacity>
    )
  }

  render() {
    const cities = this.state.cities.map(this.cityIcon)
    const { loading } = this.state
    return (
      <View style={styles.wrapper}>
        <Header title={t('regions.pick')} />
        <LinkedScroll>
          <View style={styles.content}>
            {cities}
            {loading ? (
              <Spinner />
            ) : cities.length === 0 ? (
              <View style={styles.voteWrapper}>
                <Text style={styles.vote}>{t('regions.error')}</Text>
                <LinkButton
                  onClick={this.triggerRetry}
                  label={t('app.errorRetry')}
                />
              </View>
            ) : null}
            <View style={styles.voteWrapper}>
              <Text style={styles.vote}>
                {t('regions.vote', { appname: t('app.name') })}
              </Text>
              <LinkButton
                href="https://twitter.com/dymajoltd"
                label={t('regions.activator')}
              />
            </View>
          </View>
        </LinkedScroll>
      </View>
    )
  }
}

styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    paddingTop: vars.padding,
    paddingBottom: vars.padding,
    paddingLeft: vars.padding,
    paddingRight: vars.padding,
  },
  voteWrapper: {
    paddingTop: vars.padding,
    paddingBottom: vars.padding / 2,
  },
  vote: {
    fontSize: vars.defaultFontSize,
    fontFamily: vars.fontFamily,
    textAlign: 'center',
    marginBottom: vars.padding,
  },
  region: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#333',
    backgroundSize: '100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '50% 50%',
    overflow: 'hidden',
    marginBottom: 10,
    borderRadius: 5,
    padding: 5,
    height: 125,
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)',
    cursor: 'default',
  },
  regionText: {
    textAlign: 'center',
    position: 'relative',
    color: '#fff',
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: vars.fontFamily,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  regionTextSubHeader: {
    paddingBottom: 5,
    fontSize: vars.defaultFontSize,
  },
  regionTextHeader: {
    marginTop: 'auto',
    fontSize: 14,
  },
})

export default Region
