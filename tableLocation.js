let tableLocation = new Vue({
	el: "#tableLocation",
	data: {
		//MAIN DATA
		location: [],
		//SECONDARY DATA
		locationType: [],
		deliveryDayCheckbox: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
		deliveryDayValues: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "ANY", null],
		province: [],
		//FILTER INPUTS
		filterLocationID: "",
		filterDescription: "",
		filterAddress: "",
		filterCity: "",
		filterProvince: [],
		filterLocationTypeID: [],
		filterDeliveryDay: [],
		filterInactive: [1],
		//TABLE HEADER AND SORTING
		sortedCat: "",
		header: {
			"ID": "locationID",
			"Description": "description",
			"Address": "address",
			"City": "city",
			"Province": "province",
			"Postal Code": "postalCode",
			"Country": "country",
			"Location Type": "locationTypeID",
			"Delivery Day": "deliveryDay",
			"Active": "active",
			"": null
		},
		//PERMISSIONS
		canCreateLocation: false,
		canUpdateLocation: false,
		canDeleteLocation: false,
		//FORM
		temp: {},
		formType: "",
		showForm: false,
		//FORM VALIDATION
		validLocationID: true,
		validProvince: true,
		validPostalCode: true,
		validLocationTypeID: true,
		validDeliveryDay: true,
	},
	computed: {
		filteredLocation() {
			const location = this.location,
				filterLocationID = this.filterLocationID,
				filterDescription = this.filterDescription,
				filterAddress = this.filterAddress,
				filterCity = this.filterCity,
				filterProvince = this.filterProvince,
				filterLocationTypeID = this.filterLocationTypeID,
				filterDeliveryDay = this.filterDeliveryDay,
				filterInactive = this.filterInactive;
			let temp = [];
			for (let i = 0; i < location.length; i++) {
				const loc = location[i];
				if (filterRow(filterLocationID, loc.locationID)) {
					if (filterRow(filterAddress, loc.address)) {
						if (filterRow(filterCity, loc.city)) {
							if (filterLocationTypeID.length === 0 || filterLocationTypeID.includes(loc.locationTypeID)) {
								if (filterRow(filterDescription, loc.description)) {
									if (filterProvince.length === 0 || filterProvince.includes(loc.province)) {
										if (filterDeliveryDay.length === 0 || filterDeliveryDay.includes(loc.deliveryDay) || loc.deliveryDay === "ANY" || loc.deliveryDay === null) {
											if (filterInactive.includes(loc.active)) {
												temp.push(loc);
											}
										}
									}
								}
							}
						}
					}
				}
			}
			return temp;
		}
	},
	methods: {
		readLocation: function () {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "select l.locationID, l.description, l.address, l.city, l.province, l.postalCode, l.country, l.locationTypeID, l.deliveryDay, l.active from location l"
					}
				})
				.then(function (response) {
					tableLocation.location = response.data;
				})
				.catch(function (error) {
					alert(error);
				});
		},
		sort: function (e) {
			const prop = this.header[e.target.innerHTML];
			let res = globalSort(this.location, prop, this.sortedCat);
			this.sortedCat = res[0];
			this.location = res[1];
		},
		createLocation: function () {
			this.formType = "Create a Location";
			this.showForm = true;
			this.temp = {
				locationID: "",
				description: "",
				address: "",
				city: "",
				province: "",
				postalCode: "",
				country: "",
				locationTypeID: "",
				deliveryDay: "",
				active: 1
			};
			this.resetFormValidation();
		},
		updateLocation: function (index) {
			this.formType = "Update a Location";
			this.temp = Object.assign(this.temp, this.location[index]);
			this.showForm = true;
			this.resetFormValidation();
		},
		deleteLocation: function (locationID) {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "update location set active = false where locationID = ?",
						types: "i",
						values: [locationID]
					}
				})
				.then(function (response) {
					alert(response.data);
				})
				.catch(function (error) {
					alert(error);
				});
		},
		submitForm: function () {
			let params;
			if (this.formType === "Create a Location") {
				params = {
					stmt: "insert into location (locationID, description, address, city, province, postalCode, country, locationTypeID, deliveryDay, active) values (?,?,?,?,?,?,?,?,?,?)",
					types: "sssssssssi",
					values: [
						this.temp.locationID,
						this.temp.description,
						this.temp.address,
						this.temp.city,
						this.temp.province,
						this.temp.postalCode,
						this.temp.country,
						this.temp.locationTypeID,
						this.temp.deliveryDay,
						this.temp.active
					]
				};
			} else {
				params = {
					stmt: "update location set description = ?, address = ?, city = ?, province = ?, postalCode = ?, country = ?, locationTypeID = ?, deliveryDay = ?, active = ? where locationID = ?",
					types: "ssssssssis",
					values: [
						this.temp.description,
						this.temp.address,
						this.temp.city,
						this.temp.province,
						this.temp.postalCode,
						this.temp.country,
						this.temp.locationTypeID,
						this.temp.deliveryDay,
						this.temp.active,
						this.temp.locationID
					]
				};
			};
			this.validLocationID = checkNotEmptyString(this.temp.locationID);
			this.validProvince = checkNotEmptyString(this.temp.province);
			this.validPostalCode = checkPostalCode(this.temp.postalCode);
			this.validLocationTypeID = checkNotEmptyString(this.temp.locationTypeID);
			this.validDeliveryDay = checkNotEmptyString(this.temp.deliveryDay);
			if (this.validLocationID && this.validPostalCode && this.validLocationTypeID && this.validDeliveryDay) {
				axios
					.get("/BullsEye/api/mysqli.php", {
						params: params
					})
					.then(function (response) {
						if (response.data === 1) {
							alert("success");
						} else {
							alert("fail");
						};
						this.showForm = false;
						tableLocation.readLocation();
					})
					.catch(function (error) {
						alert(error);
					});
			};
		},
		cancelForm: function () {
			this.showForm = false;
		},
		resetFormValidation: function () {
			this.validLocationID = true;
			this.validProvince = true;
			this.validPostalCode = true;
			this.validLocationTypeID = true;
			this.validDeliveryDay = true;
		}
	}
});