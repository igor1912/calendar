describe('CalendarService', function () {
	'use strict';

	let CalendarService, DavClient, StringUtility, XMLUtility, CalendarFactory, WebCal, $q, $rootScope, firstDeferred;

	const xmlParser = new DOMParser();
	const xmlCurrentUserPrincipal = `<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
 <d:response>
  <d:href>/remote.php/dav/</d:href>
  <d:propstat>
   <d:prop>
    <d:current-user-principal>
     <d:href>/remote.php/dav/principals/users/admin/</d:href>
    </d:current-user-principal>
   </d:prop>
   <d:status>HTTP/1.1 200 OK</d:status>
  </d:propstat>
 </d:response>
</d:multistatus>`;

	const xmlCalendarHomeSet = `<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
 <d:response>
  <d:href>/remote.php/dav/principals/users/admin/</d:href>
  <d:propstat>
   <d:prop>
    <cal:calendar-home-set>
     <d:href>/remote.php/dav/calendars/admin/</d:href>
    </cal:calendar-home-set>
   </d:prop>
   <d:status>HTTP/1.1 200 OK</d:status>
  </d:propstat>
 </d:response>
</d:multistatus>`;


	beforeEach(module('Calendar', function($provide) {
		DavClient = {};
		DavClient.NS_DAV = '*NSDAV*';
		DavClient.NS_IETF = '*NSIETF*';
		DavClient.NS_APPLE = '*NS_APPLE*';
		DavClient.NS_CALENDARSERVER = '*NS_CALENDARSERVER*';
		DavClient.NS_OWNCLOUD = '*NS_OWNCLOUD*';
		DavClient.buildUrl = jasmine.createSpy();
		DavClient.request = jasmine.createSpy();
		DavClient.propFind = jasmine.createSpy();
		DavClient.getNodesFullName = jasmine.createSpy();
		DavClient.wasRequestSuccessful = jasmine.createSpy();

		StringUtility = {};
		StringUtility.uri = jasmine.createSpy();

		XMLUtility = {};
		XMLUtility.getRootSkeleton = jasmine.createSpy();
		XMLUtility.serialize = jasmine.createSpy();

		CalendarFactory = {};
		CalendarFactory.calendar = jasmine.createSpy();
		CalendarFactory.webcal = jasmine.createSpy();

		WebCal = {};
		WebCal.isWebCal = jasmine.createSpy();

		OC.requestToken = 'requestToken42';
		OC.linkToRemoteBase = jasmine.createSpy();

		$provide.value('DavClient', DavClient);
		$provide.value('StringUtility', StringUtility);
		$provide.value('XMLUtility', XMLUtility);
		$provide.value('CalendarFactory', CalendarFactory);
		$provide.value('WebCal', WebCal);
	}));

	beforeEach(inject(function (_$q_, _$rootScope_) {
		$q = _$q_;
		$rootScope = _$rootScope_;

		// mixing ES6 Promises and $q ain't no good
		// ES6 Promises will be replaced with $q for the unit tests
		if (window.Promise !== $q) {
			window.Promise = $q;
		}

		OC.linkToRemoteBase.and.returnValue('remote-dav');
		DavClient.buildUrl.and.returnValue('fancy-url');

		firstDeferred = $q.defer();
		DavClient.propFind.and.returnValue(firstDeferred.promise);
	}));

	beforeEach(inject(function (_CalendarService_) {
		CalendarService = _CalendarService_;
	}));

	it('should initialize correctly with creating the service', function() {
		DavClient.wasRequestSuccessful.and.returnValues(true, true);

		const xmlDoc = xmlParser.parseFromString(xmlCurrentUserPrincipal, 'text/xml');
		const properties = xmlDoc.getElementsByTagNameNS('DAV:', 'propstat')[0].children[0].children;
		firstDeferred.resolve({
			body: {
				href: '',
				propStat: [{
					properties: properties,
					status: 'HTTP/1.1 200 OK'
				}]
			},
			status: 207
		});
	});

	it('should initialize correctly with creating the service - current-user-principal fails', function() {

	});

	it('should initialize correctly with creating the service - calendar-home-set fails', function() {

	});

	it('should fetch all calendars', function() {
		//const skeleton=[], dPropChildren=[];
		//XMLUtility.getRootSkeleton.and.returnValue([skeleton, dPropChildren]);
		//XMLUtility.serialize.and.returnValue('xmlPayload1337');
	});

	it('should fetch one calendar', function() {

	});

	it('should fetch a public calendar by it\'s token', function() {

	});

	it('should create a calendar', function() {

	});

	it('should create a webcal subscription', function() {

	});

	it('should update a calendar', function() {

	});

	it('should delete a calendar', function() {

	});

	it('should share a calendar', function() {

	});

	it('should update a share of a calendar', function() {

	});

	it('should unshare a calendar', function() {

	});

	it('should publish a calendar', function() {

	});

	it('should unpublish a calendar', function() {

	});
});
