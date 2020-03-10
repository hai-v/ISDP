let tableInventory = new Vue({
	el: "#tableInventory",
	data: {
		//MAIN DATA
		inventory: [],
		//SECONDARY DATA
		location: [],
		itemCategory: [],
		//FILTER INPUTS
		filterItemID: "",
		filterLocationDescription: [],
		filterSku: "",
		filterItemName: "",
		filterCategoryName: [],
		filterDescription: "",
		filterInactive: [1], //show inventory with active items by default
		sortedCat: "",
		//TABLE HEADER AND SORTING    
		header: {
			"ID": "itemID",
			"Name": "itemName",
			"Location": "locationDescription",
			"SKU": "sku",
			"Description": "description",
			"Category": "categoryName",
			"Cost Price": "costPrice",
			"Retail Price": "retailPrice",
			"Quantity": "quantity",
			"Reorder Threshold": "reorderThreshold",
			"Reorder Level": "reorderLevel",
			"Active": "active",
			"": null
		},
		//PERMISSIONS
		//update inventory is dependent on current user's assigned location, so it's a method
		canDeleteInventory: false,
		//FORM
		temp: {},
		formType: "",
		showForm: false,
		//FORM VALIDATION:
		validReorderThreshold: true,
		validReorderLevel: true
	},
	computed: {
		filteredInventory() {
			const inventory = this.inventory,
				itemID = this.filterItemID.toString(),
				itemName = this.filterItemName,
				filterLocation = this.filterLocationDescription,
				sku = this.filterSku,
				filterCategoryName = this.filterCategoryName,
				description = this.filterDescription,
				filterInactive = this.filterInactive;
			let temp = [];
			for (let i = 0; i < inventory.length; i++) {
				let inv = inventory[i];
				if (filterRow(itemID, inv.itemID.toString())) {
					if (filterRow(itemName, inv.itemName)) {
						if (
							filterLocation.includes(inv.locationDescription) ||
							filterLocation.length === 0
						) {
							if (filterRow(sku, inv.sku)) {
								if (
									filterCategoryName.includes(
										inv.categoryName
									) ||
									filterCategoryName.length === 0
								) {
									if (
										filterRow(description, inv.description)
									) {
										if (filterInactive.includes(inv.active)) {
											temp.push(inv);
										}
									}
								}
							}
						}
					}
				}
			};
			return temp;
		}
	},
	methods: {
		canUpdateInventory: function (index) {
			let allowed = false;
			if (checkPermission(["CRUD", "UPDATE ALL INVENTORY"])) {
				allowed = true;
			} else {
				if (this.filteredInventory[index].locationID === curUser.locationID) {
					allowed = true;
				}
			}
			return allowed;
		},
		readInventory: function () {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "select inv.itemID, i.itemName, loc.locationID, loc.description as 'locationDescription', inv.quantity, inv.reorderThreshold, inv.reorderLevel, i.sku, i.description, i.categoryName, i.active, i.costPrice, i.retailPrice from inventory inv, item i, location loc where inv.itemID = i.itemID and loc.locationID = inv.locationID"
					}
				})
				.then(function (response) {
					tableInventory.inventory = response.data;
				})
				.catch(function (error) {
					alert(error);
				});
		},
		sort: function (e) {
			const prop = this.header[e.target.innerText];
			let res = globalSort(this.inventory, prop, this.sortedCat);
			this.sortedCat = res[0];
			this.inventory = res[1];
		},
		updateInventory: function (index) {
			this.temp = Object.assign(this.temp, this.filteredInventory[index]);
			this.formType = "Update Reorder Quantity";
			this.showForm = true;
			this.validReorderLevel = true;
			this.validReorderThreshold = true;
		},
		submitInventory: function () {
			this.validReorderThreshold = checkInteger(this.temp.reorderThreshold.toString());
			this.validReorderLevel = checkInteger(this.temp.reorderLevel.toString());
			if (this.validReorderLevel && this.validReorderThreshold) {
				let reorderThreshold = parseInt(this.temp.reorderThreshold),
					reorderLevel = parseInt(this.temp.reorderLevel);
				this.validReorderThreshold = reorderThreshold >= 0 && reorderThreshold <= reorderLevel;
				this.validReorderLevel = reorderLevel >= 0 && reorderThreshold <= reorderLevel; 
				if (this.validReorderLevel && this.validReorderThreshold) {
					axios
						.get("/BullsEye/api/mysqli.php", {
							params: {
								stmt: "update inventory set reorderLevel = ?, reorderThreshold = ? where itemID = ? and locationID = ?",
								types: "iiis",
								values: [
									this.temp.reorderLevel,
									this.temp.reorderThreshold,
									this.temp.itemID,
									this.temp.locationID
								]
							}
						})
						.then(function (response) {
							if (response.data === 1) {
								alert("success");
								tableInventory.readInventory();
							} else {
								alert("fail");
							}
						})
						.catch(function (error) {
							alert(error);
						});
				}
			}
		},
		cancelForm: function () {
			this.showForm = false;
		}
	}
});