let tableCourier = new Vue({
	el: "#tableCourier",
	data: {
		//MAIN DATA
		courier: [],
		//SECONDARY DATA
		province: [],
		//FILTER INPUTS
		courierID: "",
		courierName: "",
		address: "",
		courierEmail: "",
		courierPhone: "",
		filterInactive: [1],
		//TABLE HEADER AND SORTING
		header: {
			"ID": "courierID",
			"Name": "courierName",
			"Address": "address",
			"City": "city",
			"Province": "provinceID",
			"Postal Code": "postalCode",
			"Country": "country",
			"Email": "courierEmail",
			"Phone": "courierPhone",
			"Notes": "notes",
			"Active": "active",
			"": null
		},
		//PERMISSIONS
		canCreateCourier: false,
		canUpdateCourier: false,
		canDeleteCourier: false,
		//FORM
		temp: {},
		formType: "",
		showForm: false,
		//FORM VALIDATION
		validProvince: true,
		validPostalCode: true,
		validCourierEmail: true,
		validCourierPhone: true,
	},
	computed: {
		filteredCourier() {
			const courier = this.courier,
				filterCourierID = this.courierID,
				filterCourierName = this.courierName,
				filterAddress = this.address,
				filterCourierEmail = this.courierEmail,
				filterCourierPhone = this.courierPhone,
				filterInactive = this.filterInactive;
			let temp = [];
			for (let i = 0; i < courier.length; i++) {
				const c = courier[i];
				if (filterRow(filterCourierID, c.courierID)) {
					if (filterRow(filterCourierName, c.courierName)) {
						if (filterRow(filterAddress, c.address)) {
							if (filterRow(filterCourierEmail, c.courierEmail)) {
								if (filterRow(filterCourierPhone, c.courierPhone)) {
									if (filterInactive.includes(c.active)) {
										temp.push(c);
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
		readCourier: function () {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "select c.courierID, c.courierName, c.address, c.city, c.provinceID, c.postalCode, c.country, c.courierEmail, c.courierPhone, c.notes, c.active from courier c"
					}
				})
				.then(function (response) {
					tableCourier.courier = response.data;
				})
				.catch(function (error) {
					alert(error);
				});
		},
		sort: function (e) {
			const prop = this.header[e.target.innerHTML];
			let res = globalSort(this.courier, prop, this.sortedCat);
			this.sortedCat = res[0];
			this.courier = res[1];
		},
		createCourier: function () {
			this.formType = "Create";
			this.showForm = true;
			this.temp = {
				courierID: 0,
				courierName: "",
				address: "",
				city: "",
				provinceID: "",
				postalCode: "",
				country: "",
				courierEmail: "",
				courierPhone: "",
				notes: "",
				active: 1
			};
			this.resetFormValidation();
		},
		updateCourier: function (courierID) {
			this.formType = "Update";
			this.temp = Object.assign(this.temp, this.courier[courierID]);
			this.showForm = true;
			this.resetFormValidation();
		},
		deleteCourier: function (courierID) {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "update courier set active = false where courierID = ?",
						types: "i",
						values: [courierID]
					}
				})
				.then(function (response) {
					tableCourier.readCourier();
				})
				.catch(function (error) {
					alert(error);
				});
		},
		submitForm: function () {
			let params;
			if (this.CreateUpdate === "Create") {
				params = {
					stmt: "call createCourier(?,?,?,?,?,?,?,?,?)",
					types: "sssssssss",
					values: [
						this.temp.courierID,
						this.temp.courierName,
						this.temp.address,
						this.temp.city,
						this.temp.provinceID,
						this.temp.postalCode,
						this.temp.country,
						this.temp.courierEmail,
						this.temp.courierPhone,
						this.temp.notes
					]
				};
			} else {
				params = {
					stmt: "update courier set courierName = ?, address = ?, city = ?, provinceID = ?, postalCode = ?, country = ?, courierEmail = ?, courierPhone = ?, notes = ?, active = ? where courierID = ?",
					types: "sssssssssii",
					values: [
						this.temp.courierName,
						this.temp.address,
						this.temp.city,
						this.temp.provinceID,
						this.temp.postalCode,
						this.temp.country,
						this.temp.courierEmail,
						this.temp.courierPhone,
						this.temp.notes,
						this.temp.active,
						this.temp.courierID
					]
				};
			}
			this.validProvince = checkNotEmptyString(this.temp.province);
			this.validPostalCode = checkPostalCode(this.temp.postalCode);
			this.validCourierEmail = checkEmail(this.temp.courierEmail);
			this.validCourierPhone = checkPhoneNumber(this.temp.courierPhone);
			if (this.validProvince && this.validPostalCode && this.validCourierEmail && this.validCourierPhone) {
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
						tableUser.readUser();
					})
					.catch(function (error) {
						alert(error);
					});
			}
		},
		cancelForm: function () {
			this.showForm = false;
		},
		resetFormValidation: function () {
			this.validCourierPhone = true;
			this.validCourierEmail = true;
			this.validPostalCode = true;
			this.validProvince = true;
		}
	}
});