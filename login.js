let login = new Vue({
	el: "#root",
	data: {
		//MAIN DATA
		userID: "",
		password: "",
		//SECONDARY DATA
		newPassword: "",
		confirmPassword: "",
		//FORM
		showForm: false,
		//FORM VALIDATION
		validUserID: true,
		validPassword: true,
		validNewPassword: true,
		validConfirmPassword: true,
	},
	computed: {

	},
	methods: {
		checkPassword: function () {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "select u.userID, loc.description, u.roleID, u.active, loc.locationID from user u, location loc where userID = (?) and password = md5((?)) and u.locationID = loc.locationID",
						types: "ss",
						values: new Array(this.userID, this.password)
					}
				})
				.then(function (response) {
					if (response.data.length === 1) {
						sessionStorage.setItem(
							"curUser",
							JSON.stringify(response.data[0])
						);
						location.href = "main.html";
					} else {
						login.validPassword = false;
						login.password = "";
					}
				})
				.catch(function (error) {
					alert(error);
				});
		},
		login: function () {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "select * from user where userID = (?)",
						types: "s",
						values: new Array(this.userID)
					}
				})
				.then(function (response) {
					if (response.data.length >= 1) {
						login.checkPassword();
					} else {
						login.validUserID = false;
						login.userID = "";
						login.password = "";
					};
				})
				.catch(function (error) {
					alert(error);
				});
		},
		resetPassword: function () {
			this.showForm = true;
			this.validUserID = true;
		},
		submitPassword: function () {
			console.log(checkPassword(this.password));
			login.validNewPassword = checkPassword(login.newPassword);
			login.validConfirmPassword = login.confirmPassword === login.newPassword;
			if (this.validNewPassword && this.validConfirmPassword) {
				axios
					.get("/BullsEye/api/mysqli.php", {
						params: {
							stmt: "update user set password = md5(?) where userID = ?",
							types: "ss",
							values: [this.newPassword, this.userID],
						}
					})
					.then(function (response) {
						if (response.data === 1) {
							alert("success");
						} else {
							alert("fail");
						};
						this.showForm = false;
						login.checkPassword();
					})
					.catch(function (error) {
						alert(error);
					});
			}
		},
		cancelForm: function () {
			this.showForm = false;
		},
		wrongUser: function () {
			this.validUserID = false;
		},
		wrongPassword: function () {
			this.validPassword = false;
		}
	}
});