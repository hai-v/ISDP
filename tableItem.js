let tableItem = new Vue({
	el: "#tableItem",
	data: {
		//MAIN DATA
		item: [],
		//SECONDARY DATA
		itemCategory: [],
		supplier: [],
		//FILTER INPUTS
		filterItemID: "",
		filterItemName: "",
		filterSku: "",
		filterDescription: "",
		filterCategoryName: [],
		filterWeight: 0,
		filterCostPrice: 0,
		filterRetailPrice: 0,
		filterCompanyName: [],
		filterCaseSize: 0,
		filterNotes: "",
		filterInactive: [1],
		//TABLE HEADER AND SORTING
		sortedCat: "",
		header: {
			"ID": "itemID",
			"Name": "itemName",
			"SKU": "sku",
			"Description": "description",
			"Cateogory": "categoryName",
			"Weight": "weight",
			"Cost Price": "costPrice",
			"Retail Price": "retailPrice",
			"Supplier": "companyName",
			"Case Size": "caseSize",
			"Notes": "notes",
			"Active": "active",
			"": null
		},
		//PERMISSIONS
		canCreateItem: false,
		canReadItem: false,
		canUpdateItem: false,
		canDeleteItem: false,
		//FORM
		temp: {},
		formType: "",
		showForm: false,
		//FORM VALIDATION
		validCategoryName: true,
		validWeight: true,
		validCostPrice: true,
		validRetailPrice: true,
		validSupplierID: true,
		validCaseSize: true,
	},
	computed: {
		filteredItem() {
			const item = this.item,
				filterItemID = this.filterItemID,
				filterItemName = this.filterItemName,
				filterCategoryName = this.filterCategoryName,
				filterSku = this.filterSku,
				filterDescription = this.filterDescription,
				filterCompanyName = this.filterCompanyName,
				filterNotes = this.filterNotes;
			filterInactive = this.filterInactive;
			let temp = [];
			for (let i = 0; i < item.length; i++) {
				const it = item[i];
				if (filterRow(filterItemID, it.itemID)) {
					if (filterRow(filterItemName, it.itemName)) {
						if (filterCategoryName.length === 0 || filterCategoryName.includes(it.categoryName)) {
							if (filterCompanyName.length === 0 || filterCompanyName.includes(it.companyName)) {
								if (filterRow(filterNotes, it.notes)) {
									if (filterRow(filterSku, it.sku)) {
										if (filterRow(filterDescription, it.description)) {
											if (filterInactive.includes(it.active)) {
												temp.push(it);
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
		readItem: function () {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "select i.itemID, i.itemName, i.sku, i.description, i.categoryName, i.weight, i.costPrice, i.retailPrice, s.companyName, s.supplierID, i.caseSize, i.notes, i.active from item i, supplier s where i.supplierID = s.supplierID order by i.itemID ASC"
					}
				})
				.then(function (response) {
					tableItem.item = response.data;

				})
				.catch(function (error) {
					alert(error);
				});
		},
		sort: function (e) {
			const prop = this.header[e.target.innerHTML];
			let res = globalSort(this.item, prop, this.sortedCat);
			this.sortedCat = res[0];
			this.item = res[1];
		},
		deleteItem: function (itemID) {
			axios
				.get("/BullsEye/api/mysqli.php", {
					params: {
						stmt: "update item set active = false where itemID = ?",
						types: "i",
						values: [itemID]
					}
				})
				.then(function (response) {
					alert(response.data);
				})
				.catch(function (error) {
					alert(error);
				});
		},
		createItem: function () {
			this.formType = "Create";
			this.showForm = true;
			this.temp = {
				itemName: "",
				sku: "",
				description: "",
				categoryName: "",
				weight: 0.0,
				costPrice: 0.0,
				retailPrice: 0.0,
				supplierID: "",
				caseSize: 1,
				notes: ""
			};
			this.resetFormValidation();
		},
		updateItem: function (index) {
			this.formType = "Update";
			this.temp = Object.assign(this.temp, this.item[index]);
			this.showForm = true;
			this.resetFormValidation();
		},
		submitForm: function () {
			let params;
			if (this.formType === "Create") {
				params = {
					stmt: "call createItem(?,?,?,?,?,?,?,?,?,?)",
					types: "ssssdddiis",
					values: [
						this.temp.itemName,
						this.temp.sku,
						this.temp.description,
						this.temp.categoryName,
						this.temp.weight,
						this.temp.costPrice,
						this.temp.retailPrice,
						this.temp.supplierID,
						this.temp.caseSize,
						this.temp.notes
					]
				};
			} else {
				params = {
					stmt: "update item set itemName = ?, sku = ?, description = ?, categoryName = ?, weight = ?, costPrice = ?, retailPrice = ?, supplierID = ?, caseSize = ?, notes = ?, active = ? where itemID = ?",
					types: "ssssdddiisii",
					values: [
						this.temp.itemName,
						this.temp.sku,
						this.temp.description,
						this.temp.categoryName,
						this.temp.weight,
						this.temp.costPrice,
						this.temp.retailPrice,
						this.temp.supplierID,
						this.temp.caseSize,
						this.temp.notes,
						this.temp.active,
						this.temp.itemID
					]
				};
			};
			this.validCategoryName = checkNotEmptyString(this.temp.categoryName);
			this.validWeight = checkFloat(this.temp.weight.toString()) && this.temp.weight > 0;
			this.validCostPrice = checkFloat(this.temp.costPrice.toString()) && this.temp.costPrice > 0;
			this.validRetailPrice = checkFloat(this.temp.retailPrice) && this.temp.retailPrice > 0;
			this.validSupplierID = checkNotEmptyString(this.temp.supplierID);
			this.validCaseSize = checkInteger(this.temp.caseSize.toString()) && this.temp.caseSize > 0;
			if (this.validCategoryName && this.validWeight && this.validCostPrice && this.validRetailPrice && this.validSupplierID && this.validCaseSize) {
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
						tableItem.readItem();
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
			this.validCategoryName = true;
			this.validWeight = true;
			this.validCostPrice = true;
			this.validRetailPrice = true;
			this.validSupplierID = true;
			this.validCaseSize = true;
		}
	}
});