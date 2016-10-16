/**
 * Calendar App
 *
 * @author Georg Ehrke
 * @copyright 2016 Georg Ehrke <oc.list@georgehrke.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

app.service('CalendarFactory', function($window, DavClient, Calendar, WebCal) {
	'use strict';

	const context = {};

	const SHARE_USER_PREFIX = 'principal:principals/users/';
	const SHARE_GROUP_PREFIX = 'principal:principals/groups/';

	context.acl = function(props, userPrincipal) {
		const acl = props['{' + DavClient.NS_DAV + '}acl'] || [];
		let canWrite = false;

		acl.forEach(function(rule) {
			let href = rule.getElementsByTagNameNS(DavClient.NS_DAV, 'href');
			if (href.length === 0) {
				return;
			}

			if (href[0].textContent !== userPrincipal)  {
				return;
			}

			const writeNode = rule.getElementsByTagNameNS(DavClient.NS_DAV, 'write');
			if (writeNode.length > 0) {
				canWrite = true;
			}
		});

		return canWrite;
	};

	context.color = function(props) {
		const colorProp = props['{' + DavClient.NS_APPLE + '}calendar-color'];
		const fallbackColor = angular.element('#fullcalendar').attr('data-defaultColor');

		if (angular.isString(colorProp) && colorProp.length > 0) {
			//some stupid clients store an alpha value in the rgb hash (like #rrggbbaa) *cough cough* Apple Calendar *cough cough*
			//but some browsers can't parse that *cough cough* Safari *cough cough*
			if (colorProp.length === 9) {
				return colorProp.substr(0,7);
			}
			return colorProp;
		} else {
			return fallbackColor;
		}
	};

	context.components = function(props) {
		const components = props['{' + DavClient.NS_IETF + '}supported-calendar-component-set'] || [];
		const simpleComponents = {
			vevent: false,
			vjournal: false,
			vtodo: false
		};

		components.forEach(function(component) {
			const name = component.attributes.getNamedItem('name').textContent.toLowerCase();

			if (simpleComponents.hasOwnProperty(name)) {
				simpleComponents[name] = true;
			}
		});

		return simpleComponents;
	};

	context.displayname = function(props) {
		return props['{' + DavClient.NS_DAV + '}displayname'];
	};

	context.enabled = function(props, owner) {
		if (angular.isDefined(props['{' + DavClient.NS_OWNCLOUD + '}calendar-enabled'])) {
			if (owner) {
				return owner === oc_current_user;
			} else {
				return false;
			}
		} else {
			return (props['{' + DavClient.NS_OWNCLOUD + '}calendar-enabled'] === '1');
		}
	};

	context.order = function(props) {
		return props['{' + DavClient.NS_APPLE + '}calendar-order'];
	};

	context.owner = function(props) {
		const ownerProperty = props['{' + DavClient.NS_DAV + '}owner'];
		if (Array.isArray(ownerProperty) && ownerProperty.length !== 0) {
			const owner = ownerProperty[0].textContent.slice(0, -1);
			const index = owner.indexOf('/remote.php/dav/principals/users/');
			if (index !== -1) {
				// '/remote.php/dav/principals/users/'.length === 33
				return owner.substr(index + 33);
			}
		}

		return null;
	};

	context.shares = function(props, owner) {
		const shareProp = props['{' + DavClient.NS_OWNCLOUD + '}invite'];
		const shares = {
			users: [],
			groups: []
		};

		if (!Array.isArray(shareProp)) {
			return shares;
		}

		shareProp.forEach(function(share) {
			let href = share.getElementsByTagNameNS('DAV:', 'href');
			if (href.length === 0) {
				return;
			}
			href = href[0].textContent;

			let access = share.getElementsByTagNameNS(DavClient.NS_OWNCLOUD, 'access');
			if (access.length === 0) {
				return;
			}
			access = access[0];

			let writable = access.getElementsByTagNameNS(DavClient.NS_OWNCLOUD, 'read-write');
			writable = writable.length !== 0;

			if (href.startsWith(SHARE_USER_PREFIX) && href.substr(SHARE_USER_PREFIX.length) !== owner) {
				shares.users.push({
					id: href.substr(SHARE_USER_PREFIX.length),
					displayname: href.substr(SHARE_USER_PREFIX.length), //TODO - fix me
					writable: writable
				});
			} else if (href.startsWith(SHARE_GROUP_PREFIX)) {
				shares.groups.push({
					id: href.substr(SHARE_GROUP_PREFIX.length),
					displayname: href.substr(SHARE_GROUP_PREFIX.length),
					writable: writable
				});
			}
		});

		return shares;
	};

	context.shareableAndPublishable = function(props, writable, publicMode) {
		let shareable = false;
		let publishable = false;

		if (publicMode || !writable) {
			return [shareable, publishable];
		}

		const sharingModesProp = props['{' + DavClient.NS_CALENDARSERVER + '}allowed-sharing-modes'];
		if (!Array.isArray(sharingModesProp) || sharingModesProp.length === 0) {
			// Fallback if allowed-sharing-modes is not provided
			return [writable, publishable];
		}

		for (let shareMode of sharingModesProp) {
			shareable = shareable || shareMode.localName === 'can-be-shared';
			publishable = publishable || shareMode.localName === 'can-be-published';
		}

		return [shareable, publishable];
	};

	context.publishedAndPublishURL = function(props, publicMode) {
		let published = false;
		let publishurl = null;
		let publicurl = null;

		if (angular.isDefined(props['{' + DavClient.NS_CALENDARSERVER + '}publish-url'])) {
			published = true;
			//TODO - compare this with master
			publishurl = props['{' + DavClient.NS_CALENDARSERVER + '}publish-url'][0].textContent;

			// Take care of urls ending with #
			publicurl = ($window.location.toString().endsWith('#')) ?
				$window.location.toString().slice(0, -1) :
				$window.location.toString();

			// Take care of urls ending with /
			let publicPath = (!publicurl.endsWith('/')) ? '/public/' : 'public/';

			if (!publicMode) {
				publicurl += publicPath + publishurl.substr(publishurl.lastIndexOf('/') + 1);
			}
		}

		return [published, publishurl, publicurl];
	};


	context.webcal = function(props) {
		const sourceProp = props['{' + DavClient.NS_CALENDARSERVER + '}source'];

		if (Array.isArray(sourceProp)) {
			const source = sourceProp.find(function(source) {
				return (DavClient.getNodesFullName(source) === '{' + DavClient.NS_DAV + '}href');
			});

			return source ? source.textContent : null;
		} else {
			return null;
		}
	};

	context.calendarSkeleton = function(props, userPrincipal, publicMode) {
		const simple = {};

		simple.color = context.color(props);
		simple.displayname = context.displayname(props);
		simple.components = context.components(props);
		simple.order = context.order(props);

		simple.writable = context.acl(props, userPrincipal);
		simple.owner = context.owner(props);
		simple.enabled = context.enabled(props, simple.owner);

		simple.shares = context.shares(props, simple.owner);

		const [shareable, publishable] = context.shareableAndPublishable(props, simple.writable, userPrincipal);
		simple.shareable = shareable;
		simple.publishable = publishable;

		const [published, publishurl, publicurl] = context.publishedAndPublishURL(props);
		simple.published = published;
		simple.publishurl = publishurl;
		simple.publicurl = publicurl;

		// always enabled calendars in public mode
		if (publicMode) {
			simple.enabled = true;
			simple.writable = false;
		}

		simple.writableProperties = (oc_current_user === simple.owner) && simple.writable;

		return simple;
	};

	/**
	 * get a calendar object from raw xml data
	 * @param body
	 * @param {string} userPrincipal
	 * @param {boolean} publicMode
	 * @returns {Calendar}
	 */
	this.calendar = function(body, userPrincipal, publicMode=false) {
		const href = body.href;
		const props = body.propStat[0].properties;

		const simple = context.calendarSkeleton(props, userPrincipal, publicMode);
		return Calendar(href, simple);
	};

	/**
	 * get a webcal object from raw xml data
	 * @param body
	 * @param {string} userPrincipal
	 * @param {boolean} publicMode
	 * @returns {WebCal}
	 */
	this.webcal = function(body, userPrincipal, publicMode=false) {
		const href = body.href;
		const props = body.propStat[0].properties;

		const simple = context.calendarSkeleton(props, userPrincipal, publicMode);
		simple.href = context.webcal(props);

		// WebCal is obviously not writable
		simple.writable = false;
		simple.writableProperties = (oc_current_user === simple.owner);

		return WebCal(href, simple);
	};
});
