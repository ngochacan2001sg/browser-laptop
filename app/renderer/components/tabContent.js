/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('./styles/global')
const {isWindows} = require('../../common/lib/platformUtil')
const {getTextColorForBackground} = require('../../../js/lib/color')
const {tabs} = require('../../../js/constants/config')

const newSessionSvg = require('../../extensions/brave/img/tabs/new_session.svg')

/**
 * Boilerplate component for all tab icons
 */
class TabIcon extends ImmutableComponent {
  render () {
    const tabIconStyle = {
      // Currently it's not possible to concatenate Aphrodite generated classes
      // and pre-built classes using default Aphrodite API, so we keep with inline-style
      fontSize: this.props.symbolContent ? '8px' : 'inherit',
      display: 'flex',
      alignSelf: 'center',
      width: globalStyles.spacing.iconSize,
      height: globalStyles.spacing.iconSize,
      alignItems: 'center',
      justifyContent: this.props.symbolContent ? 'flex-end' : 'center',
      fontWeight: this.props.symbolContent ? 'bold' : 'normal',
      color: this.props.symbolContent ? globalStyles.color.black100 : 'inherit'
    }
    return <div
      className={this.props.className}
      data-test-favicon={this.props['data-test-favicon']}
      onClick={this.props.onClick}>
      {
      this.props.symbol
        ? <span
          className={this.props.symbol}
          data-test-id={this.props['data-test-id']}
          data-l10n-id={this.props.l10nId}
          data-l10n-args={JSON.stringify(this.props.l10nArgs || {})}
          style={tabIconStyle}>{this.props.symbolContent}</span>
        : null
      }
    </div>
  }
}

class Favicon extends ImmutableComponent {
  get favicon () {
    return !this.props.isLoading && this.props.tabProps.get('icon')
  }

  get loadingIcon () {
    return this.props.isLoading
      ? globalStyles.appIcons.loading
      : null
  }

  get defaultIcon () {
    return (!this.props.isLoading && !this.favicon)
      ? globalStyles.appIcons.defaultIcon
      : null
  }

  get narrowView () {
    return this.props.tabProps.get('breakpoint') === 'smallest'
  }

  render () {
    const iconStyles = StyleSheet.create({
      favicon: {backgroundImage: `url(${this.favicon})`}
    })
    return this.props.tabProps.get('location') !== 'about:newtab'
      ? <TabIcon
        data-test-favicon={this.favicon}
        data-test-id={this.loadingIcon ? 'loading' : 'defaultIcon'}
        className={css(
          styles.icon,
          this.favicon && iconStyles.favicon,
          !this.props.tabProps.get('pinnedLocation') && this.narrowView && styles.faviconNarrowView
        )}
        symbol={this.loadingIcon || this.defaultIcon} />
      : null
  }
}

class AudioTabIcon extends ImmutableComponent {
  get pageCanPlayAudio () {
    return this.props.tabProps.get('audioPlaybackActive') || this.props.tabProps.get('audioMuted')
  }

  get mediumView () {
    const sizes = ['large', 'largeMedium']
    return sizes.includes(this.props.tabProps.get('breakpoint'))
  }

  get narrowView () {
    const sizes = ['medium', 'mediumSmall', 'small', 'extraSmall', 'smallest']
    return sizes.includes(this.props.tabProps.get('breakpoint'))
  }

  get locationHasSecondaryIcon () {
    return !!this.props.tabProps.get('isPrivate') || !!this.props.tabProps.get('partitionNumber')
  }

  get mutedState () {
    return this.pageCanPlayAudio && this.props.tabProps.get('audioMuted')
  }

  get unmutedState () {
    this.props.tabProps.get('audioPlaybackActive') && !this.props.tabProps.get('audioMuted')
  }

  get audioIcon () {
    return !this.mutedState
      ? globalStyles.appIcons.volumeOn
      : globalStyles.appIcons.volumeOff
  }

  render () {
    return this.pageCanPlayAudio && !this.mediumView && !this.narrowView
      ? <TabIcon className={css(styles.icon, styles.audioIcon)} symbol={this.audioIcon} onClick={this.props.onClick} />
      : null
  }
}

class PrivateIcon extends ImmutableComponent {
  get narrowView () {
    const sizes = ['small', 'extraSmall', 'smallest']
    return sizes.includes(this.props.tabProps.get('breakpoint'))
  }

  render () {
    return this.props.tabProps.get('isPrivate') && !this.props.tabProps.get('hoverState') && !this.narrowView
      ? <TabIcon className={css(styles.icon)} symbol={globalStyles.appIcons.private} />
      : null
  }
}

class NewSessionIcon extends ImmutableComponent {
  get narrowView () {
    const sizes = ['small', 'extraSmall', 'smallest']
    return sizes.includes(this.props.tabProps.get('breakpoint'))
  }

  get partitionNumber () {
    let partition = this.props.tabProps.get('partitionNumber')
    // Persistent partitions opened by `target="_blank"` will have
    // *partition-* string first, which causes bad UI. We don't need it for tabs
    if (typeof partition === 'string') {
      partition = partition.replace(/^partition-/i, '')
    }
    return partition
  }

  get partitionIndicator () {
    // For now due to UI limitations set session up to 9 visually
    return this.partitionNumber > tabs.maxAllowedNewSessions
      ? tabs.maxAllowedNewSessions
      : this.partitionNumber
  }

  get iconColor () {
    const themeColor = this.props.tabProps.get('themeColor') || this.props.tabProps.get('computedThemeColor')
    return this.props.paintTabs && themeColor
      ? getTextColorForBackground(themeColor)
      : globalStyles.color.black100
  }

  render () {
    const newSession = StyleSheet.create({
      indicator: {
        // Based on getTextColorForBackground() icons can be only black or white.
        filter: this.props.isActive && this.iconColor === 'white' ? 'invert(100%)' : 'none'
      }
    })

    return this.partitionNumber && !this.props.tabProps.get('hoverState') && !this.narrowView
      ? <TabIcon symbol
        data-test-id='newSessionIcon'
        className={css(styles.icon, styles.newSession, newSession.indicator)}
        symbolContent={this.partitionIndicator}
        {...this.props} />
      : null
  }
}

class TabTitle extends ImmutableComponent {
  get locationHasSecondaryIcon () {
    return !!this.props.tabProps.get('isPrivate') || !!this.props.tabProps.get('partitionNumber')
  }

  get isPinned () {
    return !!this.props.tabProps.get('pinnedLocation')
  }

  get hoveredOnNarrowView () {
    const sizes = ['mediumSmall', 'small', 'extraSmall', 'smallest']
    return this.props.tabProps.get('hoverState') && sizes.includes(this.props.tabProps.get('breakpoint'))
  }

  get shouldHideTitle () {
    return (this.props.tabProps.get('breakpoint') === 'mediumSmall' && this.locationHasSecondaryIcon) ||
      this.props.tabProps.get('breakpoint') === 'extraSmall' || this.props.tabProps.get('breakpoint') === 'smallest' ||
      this.hoveredOnNarrowView
  }

  get themeColor () {
    const themeColor = this.props.tabProps.get('themeColor') || this.props.tabProps.get('computedThemeColor')
    const defaultColor = this.props.tabProps.get('isPrivate') ? globalStyles.color.white100 : globalStyles.color.black100
    const activeNonPrivateTab = !this.props.tabProps.get('isPrivate') && this.props.isActive

    return activeNonPrivateTab && this.props.paintTabs && !!themeColor
      ? getTextColorForBackground(themeColor)
      : defaultColor
  }

  render () {
    const titleStyles = StyleSheet.create({
      reduceTitleSize: {
        // include a margin gutter with same size
        // as closeTabIcon to avoid title overflow
        // when hovering over a tab
        marginRight: `calc(${globalStyles.spacing.iconSize} + ${globalStyles.spacing.defaultIconPadding})`
      },
      gradientText: {
        backgroundImage: `-webkit-linear-gradient(left,
        ${this.themeColor} 90%, ${globalStyles.color.almostInvisible} 100%)`
      }
    })

    return !this.isPinned && !this.shouldHideTitle
    ? <div data-test-id='tabTitle'
      className={css(
      styles.tabTitle,
      titleStyles.gradientText,
      this.props.tabProps.get('hoverState') && titleStyles.reduceTitleSize,
      // Windows specific style
      isWindows() && styles.tabTitleForWindows
    )}>
      {this.props.pageTitle}
    </div>
    : null
  }
}

class CloseTabIcon extends ImmutableComponent {
  get isPinned () {
    return !!this.props.tabProps.get('pinnedLocation')
  }

  get narrowView () {
    const sizes = ['extraSmall', 'smallest']
    return sizes.includes(this.props.tabProps.get('breakpoint'))
  }

  render () {
    return this.props.tabProps.get('hoverState') && !this.narrowView && !this.isPinned
      ? <TabIcon
        data-test-id='closeTabIcon'
        className={css(styles.closeTab)}
        symbol={globalStyles.appIcons.closeTab}
        {...this.props} />
      : null
  }
}

const styles = StyleSheet.create({
  icon: {
    width: globalStyles.spacing.iconSize,
    minWidth: globalStyles.spacing.iconSize,
    height: globalStyles.spacing.iconSize,
    backgroundSize: globalStyles.spacing.iconSize,
    fontSize: globalStyles.fontSize.tabIcon,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignSelf: 'center',
    position: 'relative',
    textAlign: 'center',
    justifyContent: 'center',
    paddingLeft: globalStyles.spacing.defaultIconPadding,
    paddingRight: globalStyles.spacing.defaultIconPadding
  },

  iconNarrowView: {
    padding: 0
  },

  faviconNarrowView: {
    minWidth: 'auto',
    width: globalStyles.spacing.narrowIconSize,
    backgroundSize: 'contain',
    padding: '0',
    fontSize: '10px',
    backgroundPosition: 'center center'
  },

  audioIcon: {
    color: globalStyles.color.highlightBlue
  },

  newSession: {
    position: 'relative',
    backgroundImage: `url(${newSessionSvg})`,
    backgroundPosition: 'left'
  },

  closeTab: {
    opacity: '0.7',
    position: 'absolute',
    top: '0',
    right: '0',
    padding: '0 4px',
    borderTopRightRadius: globalStyles.radius.borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: globalStyles.spacing.iconSize,
    width: globalStyles.spacing.iconSize,
    height: '100%',
    border: '0',
    zIndex: globalStyles.zindex.zindexTabs,

    ':hover': {
      opacity: '1'
    }
  },

  tabTitle: {
    display: 'flex',
    flex: '1',
    WebkitUserSelect: 'none',
    boxSizing: 'border-box',
    fontSize: globalStyles.fontSize.tabTitle,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    lineHeight: '1.6',
    padding: globalStyles.spacing.defaultTabPadding,
    color: 'transparent',
    WebkitBackgroundClip: 'text'
  },

  tabTitleForWindows: {
    fontWeight: '500',
    fontSize: globalStyles.fontSize.tabTitle
  }
})

module.exports = {
  Favicon,
  AudioTabIcon,
  NewSessionIcon,
  PrivateIcon,
  TabTitle,
  CloseTabIcon
}
