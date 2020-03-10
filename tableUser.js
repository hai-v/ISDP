let tableUser = new Vue({
	el: "#tableUser",
	data: {
		//MAIN DATA
		user: [],
		//SECONDARY DATA
		role: [],
		location: [],
		//FILTER INPUTS
		filterUserID: "",
		filterLocationDescription: [],
		filterRoleID: [],
		filterInactive: [1],
		//TABLE HEADER AND SORTING
		sortedCat: "",
		header: {
			"User ID": "userID",
			"Role": "roleID",
			"Location": "description",
			"Active": "active",
			"": null
		},
		//PERMISSIONS
		canCreateUser: false,
		canUpdateUser: false,
		canDeleteUser: false,
		//FORM
		temp: {},
		formType: "",
		showForm: false,
		confirmPassword: "",
		//FORM VALIDATION
		validUserID: true,
		validPassword: true,
		validConfirmPassword: true,
		validRoleID: true,
		validLocationID: true,
	},
	computed: {
		filteredUser() {
			let temp = [];
			const user = this.user,
				filterUserID = this.filterUserID,
				filterLocationDescription = this.filterLocationDescription,
				filterRoleID = this.filterRoleID,
				filterInactive = this.filterInactive;
			for (let i = 0; i < user.length; i++) {
				let u = user[i];
				if (filterRow(filterUserID, u.userID)) {
					if (filterLocationDescription.length === 0 || filterLocationDescription.contains(u.description)) {
						if (filterRoleID.length === 0 || filterRoleID.contains(u.roleID)) {
							if (filterInactive.includes(u.active)) {
								temp.push(u);
							}
						}
					}
				}
			}
			return temp;
		}
	},
	methods: {
		readUser: function () {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "select u.userID, u.roleID, loc.description, loc.locationID, u.active from user u, location loc where u.locationID = loc.locationID"
					}
				})
				.then(function (response) {
					tableUser.user = response.data;
				})
				.catch(function (error) {
					alert(error);
				});
		},
		sort: function (e) {
			const prop = this.header[e.target.innerHTML];
			let res = globalSort(this.user, prop, this.sortedCat);
			this.sortedCat = res[0];
			this.user = res[1];
		},
		createUser: function () {
			this.formType = "Create An User";
			this.showForm = true;
			this.temp = {
				userID: "",
				password: "",
				locationID: "",
				roleID: "",
				active: 1
			};
			this.resetFormValidation();
		},
		updateUser: function (e) {
			this.formType = "Update An User";
			this.temp = Object.assign(this.temp, this.user[e]);
			this.showForm = true;
			this.resetFormValidation();
		},
		deleteUser: function (userID) {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "update user set active = false where userID = ?",
						types: "s",
						values: [userID]
					}
				})
				.then(function (response) {
					tableUser.readUser();
				})
				.catch(function (error) {
					alert(error);
				});
		},
		submitForm: function () {
			let params;
			if (this.CreateUpdate === "Create An User") {
				params = {
					stmt: "insert into user (userID, password, locationID, roleID, active) values (?, md5(?), ?, ?, ?)",
					types: "ssssi",
					values: [
						this.temp.userID,
						this.temp.password,
						this.temp.locationID,
						this.temp.roleID,
						this.temp.active
					]
				};
			} else {
				params = {
					stmt: "update user set locationID = ?, roleID = ?, active = ? where userID = ?",
					types: "sssi",
					values: [
						this.temp.locationID,
						this.temp.roleID,
						this.temp.active,
						this.temp.userID
					]
				};
			};
			this.validUserID = checkNotEmptyString(this.temp.userID);
			if (this.CreateUpdate === "Create An User") {
				this.validPassword = checkPassword(this.temp.password);
				this.validConfirmPassword = this.temp.password === this.confirmPassword;
			}
			this.validLocationID = checkNotEmptyString(this.temp.locationID);
			this.validRoleID = checkNotEmptyString(this.temp.roleID);
			if (this.validUserID && this.validPassword && this.validConfirmPassword && this.validLocationID && this.validRoleID) {
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
						console.log(response);
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
			this.validUserID = true;
			this.validPassword = true;
			this.validLocationID = true;
			this.validRoleID = true;
			this.validConfirmPassword = true;
		}
	}
});