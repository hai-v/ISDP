let curUser, permissions;

window.onload = function () {
	curUser = JSON.parse(sessionStorage.curUser);

	root.curUser = curUser;
	readPermission(curUser.roleID);

	readLocationInventory();
	readLocationUser();
	readItemCategory();
	readSupplier();
	readLocationType();
	readRole();
	readProvince();
	readTransactionType();
	readTransactionStatus();

	document.querySelector("#btnLogout").addEventListener("click", logout);
};

let root = new Vue({
	el: "#root",
	data: {
		canReadInventory: false,
		canReadUser: false,
		canReadLocation: false,
		canReadItem: false,
		canReadCourier: false,
		canReadOrder: false,
		canReadDelivery: false,
		curUser: []
	}
});

//Name: logout
//Input: void
//Output: void
//Description: Clear the current user session. Redirect page to login screen
function logout() {
	sessionStorage.removeItem("curUser");
	location.href = "index.html";
};

//Name: readPermission
//Input: string
//Output: void (kinda)
//Description: Read all actions that the role has, then assigns permission for each available CRUD activities and tables
function readPermission(roleID) {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select actionID from permission where roleID = ?",
				types: "s",
				values: [roleID]
			}
		})
		.then(function (response) {
			permissions = response.data;
			root.canReadInventory =
				checkPermission(["CRUD", "READ INVENTORY"]);
			root.canReadItem =
				checkPermission(["CRUD", "READ ITEM"]);
			root.canReadUser =
				checkPermission(["CRUD", "READ USER"]);
			root.canReadCourier =
				checkPermission(["CRUD", "READ COURIER"]);
			root.canReadLocation =
				checkPermission(["CRUD", "READ LOCATION"]);
			root.canReadDelivery = ["DELIVERY DRIVER", "STORE MANAGER", "WAREHOUSE MANAGER", "WAREHOUSE WORKER"].includes(curUser.roleID.toUpperCase());
			if (root.canReadInventory) {
				if (curUser.roleID !== "DB ADMIN" && curUser.roleID !== "Upper Management") {
					tableInventory.filterLocationDescription = [curUser.description];
				}
			};
			root.canReadOrder = checkPermission(["CRUD", "READ ORDER"]);
			if (root.canReadOrder) {
				if (curUser.roleID !== "DB ADMIN" && curUser.roleID !== "Upper Management") {
					if (curUser.roleID !== "Warehouse Manager") {
						tableOrder.filterOriginalLocationID = [curUser.locationID];
					};
					tableOrder.filterTransactionType = ["ORDER", "EMERGENCY", "BACKORDER"];
					tableOrder.filterTransactionStatus = ["NEW", "SUBMITTED", "PROCESSING", "READY", "IN TRANSIT"];
				};
				tableOrder.canSubmitAllOrders = checkPermission(["CRUD", "UPDATE ALL ORDER"]);
				tableOrder.canReadBackorderItems = checkPermission(["CRUD", "UPDATE ALL ORDER"]);
				tableOrder.canCreateStoreOrder = ["Store Manager", "Store Worker"].includes(curUser.roleID);
				tableOrder.canCreateLossOrder = ["Store Manager", "Store Worker"].includes(curUser.roleID);
				tableOrder.canCreateReturnOrder = ["Store Manager", "Store Worker"].includes(curUser.roleID);
				
				tableOrder.canCreateDamageOrder = ["Store Manager", "Store Worker"].includes(curUser.roleID);
				tableOrder.canCreateEmergencyOrder = curUser.roleID === "Store Manager";
			};
			tableItem.canCreateItem = checkPermission(["CRUD", "CREATE ITEM"]);
			tableItem.canUpdateItem = checkPermission(["CRUD", "UPDATE ITEM"]);
			tableItem.canDeleteItem = checkPermission(["CRUD", "DELETE ITEM"]);
			tableLocation.canCreateLocation = checkPermission(["CRUD", "CREATE LOCATION"]);
			tableLocation.canUpdateLocation = checkPermission(["CRUD", "UPDATE LOCATION"]);
			tableLocation.canDeleteLocation = checkPermission(["CRUD", "DELETE LOCATION"]);
			tableCourier.canCreateCourier = checkPermission(["CRUD", "CREATE COURIER"]);
			tableCourier.canUpdateCourier = checkPermission(["CRUD", "UPDATE COURIER"]);
			tableCourier.canDeleteCourier = checkPermission(["CRUD", "DELETE COURIER"]);
			tableUser.canCreateUser = checkPermission(["CRUD", "CREATE USER"]);
			tableUser.canUpdateUser = checkPermission(["CRUD", "UPDATE USER"]);
			tableUser.canDeleteUser = checkPermission(["CRUD", "DELETE USER"]);
		})
		.catch(function (error) {
			alert(error);
		});
};


//Name: readLocationInventory
//Input: void
//Output: void (kinda)
//Description: A helper method to populate location checkboxes/select options for tableInventory
function readLocationInventory() {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select distinct i.locationID, l.description from location l, inventory i where i.locationID = l.locationID"
			}
		})
		.then(function (response) {
			tableInventory.location = response.data;
			tableOrder.location = response.data;
		})
		.catch(function (error) {
			alert(error);
		});
};

//Name: readLocationUser
//Input: void
//Output: void (kinda)
//Description: A helper method to populate location checkboxes/select options for tableUser
function readLocationUser() {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select * from location"
			}
		})
		.then(function (response) {
			tableUser.location = response.data;
		})
		.catch(function (error) {
			alert(error);
		});
};

//Name: readItemCategory
//Input: void
//Output: void
//Description: A helper method to populate item category checkboxes/select option
function readItemCategory() {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select categoryName from itemCategory"
			}
		})
		.then(function (response) {
			tableInventory.itemCategory = response.data;
			tableItem.itemCategory = response.data;
		})
		.catch(function (error) {
			alert(error);
		});
};

//Name: readSupplier
//Input: void
//Output: void
//Description: A helper method to populate supplier
function readSupplier() {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select * from supplier"
			}
		})
		.then(function (response) {
			tableItem.supplier = response.data;
		})
		.catch(function (error) {
			alert(error);
		});
};

//Name: readLocationType
//Input: void
//Output: void
//Description: A helper method to populate location type
function readLocationType() {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select locationTypeID from locationType"
			}
		})
		.then(function (response) {
			tableLocation.locationType = response.data;
		})
		.catch(function (error) {
			alert(error);
		});
};

//Name: readRole
//Input: void
//Output: void
//Description: A helper method to populate role
function readRole() {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select roleID from role"
			}
		})
		.then(function (response) {
			tableUser.role = response.data;
		})
		.catch(function (error) {
			alert(error);
		});
};

//Name: readProvince
//Input: void
//Output: void
//Description: A helper method to populate province
function readProvince() {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select * from province"
			}
		})
		.then(function (response) {
			tableLocation.province = response.data;
			tableCourier.province = response.data;
		})
		.catch(function (error) {
			alert(error);
		});
};

function readTransactionStatus() {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select * from transactionstatus"
			}
		})
		.then(function (response) {
			tableOrder.transactionStatus = response.data;
		})
		.catch(function (error) {
			alert(error);
		});
};

function readTransactionType() {
	axios
		.get("/BullsEye/api/mysqli.php", {
			params: {
				stmt: "select * from transactiontype"
			}
		})
		.then(function (response) {
			tableOrder.transactionType = response.data;
		})
		.catch(function (error) {
			alert(error);
		});
}

//Name: checkPermission
//Input: array of string
//Output: boolean
//Description: based on class level variable "permissions" that contains the list of actions an user can do, retrun true if action keywords are in the array
function checkPermission(keywords) {
	if (permissions !== undefined) {
		return permissions.find(p => keywords.includes(p.actionID)) !== undefined;
	}
};