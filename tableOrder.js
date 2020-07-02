let signaturePad;

let tableOrder = new Vue({
    el: "#tableOrder",
    data: {
        //MAIN DATA
        orders: [],
        //SECONDARY DATA
        transactionStatus: [{
            transactionStatus: ""
        }],
        transactionType: [{
            transactionType: "",
            description: "",
            active: 0
        }],
        location: [],
        order: [
            [],
            []
        ],
        allItems: [],
        backorder: [],
        backorderTxn: [
            [],
            [],
            []
        ],
        //FILTER INPUTS
        filterTransactionID: "",
        filterTransactionType: [],
        filterOriginalLocationID: [],
        filterCreationDate: "",
        filterEstimatedArrival: "",
        filterTransactionStatus: [],
        filterNotes: "",
        filterItem: "",
        //TABLE HEADER AND SORTING
        header: {
            "ID": "transactionID",
            "Type": "transactionType",
            "Original Location": "originalLocationID",
            "Created Date": "creationDate",
            "Due Date": null,
            "Estimated Arrival Date": "esitmatedArrival",
            "Status": "transactionStatus",
            "Related to": "sourceTransactionID",
            "Notes": "notes",
            "": null,
        },
        headerOrder: {
            "Item ID": "itemID",
            "Name": "itemName",
            "Description": "description",
            "Category Name": "categoryName",
            "Supplier": "companyName",
            "Case Quantity": "",
            "Case Size": "caseSize",
            "": null,
        },
        headerPurchase: {
            "Item ID": "itemID",
            "Name": "itemName",
            "Description": "description",
            "Category Name": "categoryName",
            "Supplier": "companyName",
            "Quantity": "quantity",
            "": null,
        },
        headerItems: {
            "Item ID": "itemID",
            "Name": "itemName",
            "Description": "description",
            "Category Name": "categoryName",
            "Supplier": "companyName",
            "Case Quantity": "",
            "Case Size": "caseSize",
            "": null,
        },
        //PERMISSIONS
        canUpdateOrder: false,
        canUpdateTransactionStatus: false,
        canUpdateItem: false,
        canSubmitAllOrders: false,
        canReadBackorderItems: false,
        canCreateEmergencyOrder: false,
        canCreateStoreOrder: false,
        canCreateReturnOrder: false,
        canCreateLossOrder: false,
        canCreateDamageOrder: false,
        canCreateStorePurchase: false,
        //FORM
        showFormOrder: false,
        showFormInventory: false,
        showFormBackorder: false,
        showFormQuantity: false,
        showFormEmergencyAll: false,
        showFormLoss: false,
        showFormSignature: false,
        showFormPurchase: false,
        //BAND-AID FIX
        emergencyLocationID: "STJN",
        temp: {},
        paginationIndexCurr: 1,
        paginationIndexLast: 1,
        itemsShown: 10,
        action: "",
        notes: "",

    },
    computed: {
        filteredOrders() {
            const orders = this.orders,
                filterTransactionID = this.filterTransactionID.toString(),
                filterTransactionType = this.filterTransactionType,
                filterOriginalLocationID = this.filterOriginalLocationID,
                filterTransactionStatus = this.filterTransactionStatus,
                filterNotes = this.filterNotes;
            let temp = [];
            for (let i = 0; i < orders.length; i++) {
                let o = orders[i];
                if (filterRow(filterTransactionID, o.transactionID)) {
                    if (filterTransactionType.includes(o.transactionType) || filterTransactionType.length === 0) {
                        if (filterOriginalLocationID.includes(o.originalLocationID) || filterOriginalLocationID.length === 0) {
                            if (filterTransactionStatus.includes(o.transactionStatus) || filterTransactionStatus.length === 0) {
                                if (filterRow(filterNotes, o.notes)) {
                                    temp.push(o);
                                }
                            }
                        }
                    }
                }
            };
            let nextMonday = new Date();
            nextMonday.setDate(nextMonday.getDate() - nextMonday.getDay() + 1 + 7 + ((nextMonday.getDay() === 0) ? -7 : 0));
            let nextFriday = new Date();
            nextFriday.setDate(nextFriday.getDate() - nextFriday.getDay() + 5 + 7 + ((nextFriday.getDay() === 0) ? -7 : 0));
            let tempyTemp = [];
            for (let i = 0; i < temp.length; i++) {
                let ddd = new Date(temp[i].estimatedArrival);
                ddd.setHours(ddd.getHours() + 4);
                if (ddd.getDate() >= nextMonday.getDate() && ddd.getDate() <= nextFriday.getDate()) {
                    tempyTemp.push(temp[i]);
                };
            };
            tempyTemp.sort(function (a, b) {
                return new Date(a.estimatedArrival).getTime() - new Date(b.estimatedArrival).getTime();
            });

            for (let i = 0; i < tempyTemp.length; i++) {
                temp[i] = tempyTemp[i];
            };
            return temp;
        },
        items() {
            const allItems = this.allItems,
                filterItem = this.filterItem;
            if (this.paginationIndexCurr < 1) {
                this.paginationIndexCurr = 1;
            };
            if (this.paginationIndexCurr > this.paginationIndexLast) {
                this.paginationIndexCurr = this.paginationIndexLast;
            };
            let temp = [];
            for (let i = 0; i < allItems.length; i++) {
                let a = allItems[i];
                if (filterRow(filterItem, a.itemID) || filterRow(filterItem, a.itemName) || filterRow(filterItem, a.itemDescription) || filterRow(filterItem, a.categoryName) || filterRow(filterItem, a.companyName)) {
                    temp.push(a);
                }
            }
            return temp.slice((this.paginationIndexCurr - 1) * this.itemsShown, (this.paginationIndexCurr - 1) * this.itemsShown + this.itemsShown);
        }
    },
    methods: {
        canCompletePurchase: function(order) {
            if (order !== undefined) {
                return order.transactionStatus !== "COMPLETE" && order.transactionType === "SALE";
            }
        },
        canCompleteReturn: function(order) {
            if (order !== undefined) {
                return order.transactionStatus !== "COMPLETE" && order.transactionType === "RETURN";
            }
        },
        canReadOrder: function(order) {
            if (order !== undefined) {
                return order.transactionType !== "SALE" && order.transactionType !== "RETURN";
            }
        },
        canReadPurchase: function(order) {
            if (order !== undefined) {
                return order.transactionType === "SALE";
            }
        },
        canReadReturn: function(order) {
            if (order !== undefined) {
                return order.transactionType === "RETURN";
            }
        },
        canCreateItem: function (order) {
            if (order !== undefined) {
                return (checkPermission(["CRUD"]) || (checkPermission(["UPDATE ORDER"]) && (order.originalLocationID === curUser.locationID))) && order.transactionStatus === "NEW";
            };
        },
        canDeleteItem: function (order) {
            if (order !== undefined) {
                return (checkPermission(["CRUD"]) || (checkPermission(["UPDATE ORDER"]) && (order.originalLocationID === curUser.locationID))) && order.transactionStatus === "NEW";
            };
        },
        canProcessItem: function (order) {
            if (order.transactionStatus !== undefined) {
                return order.transactionStatus.toUpperCase() === "PROCESSING" && ["WAREHOUSE WORKER", "DB ADMIN", "WAREHOUSE MANAGER"].includes(curUser.roleID.toUpperCase()) && tableOrder.action === "PROCESS";
            };
        },
        canShipItem: function (order) {
            if (order.transactionStatus !== undefined) {
                return (order.transactionStatus.toUpperCase() === "READY" && ["ADMIN", "WAREHOUSE WORKER", "WAREHOUSE MANAGER"].includes(curUser.roleID.toUpperCase())) || (order.transactionStatus.toUpperCase() === "SUMITTED" && ["STORE MANAGER", "STORE WORKER"].includes(curUser.roleID)); 
            };
        },
        canReceiveItem: function (order) {
            if (order.transactionStatus !== undefined) {
                return order.transactionStatus.toUpperCase() === "IN TRANSIT" && (["ADMIN", "STORE MANAGER", "STORE WORKER"].includes(curUser.roleID.toUpperCase()) || (["ADMIN", "WAREHOUSE WORKER", "WAREHOUSE FOREMAN"].includes(curUser.roleID.toUpperCase()) && ["RETURN", "DAMAGE"].includes(order.transactionType)));
            };
        },
        canSubmitOrder: function (order) {
            if (order !== undefined) {
                let override = "STATUS_OVERRIDE";
                return new RegExp(override.toString(), "i").test(order.notes);
            };
        },
        canProcessOrder: function (order) {
            if (order.transactionStatus !== undefined) {
                return ["SUBMITTED", "PROCESSING"].includes(order.transactionStatus.toUpperCase()) && ["WAREHOUSE WORKER", "DB ADMIN", "WAREHOUSE MANAGER"].includes(curUser.roleID.toUpperCase());
            };
        },
        canShipOrder: function (order) {
            if (order.transactionStatus !== undefined) {
                return ["READY"].includes(order.transactionStatus.toUpperCase()) && ["DB ADMIN", "WAREHOUSE MANAGER"].includes(curUser.roleID.toUpperCase());
            };
        },
        canReceiveOrder: function (order) {
            if (order.transactionStatus !== undefined) {
                return ["IN TRANSIT"].includes(order.transactionStatus.toUpperCase()) && ["DB ADMIN", "STORE MANAGER", "STORE WORKER"].includes(curUser.roleID.toUpperCase())
            };
        },
        canChangeOrderQuantity: function (order) {
            if (order !== undefined) {
                return checkPermission(["CRUD"]) || (checkPermission(["UPDATE ORDER"]) && (order.originalLocationID === curUser.locationID)) && order.transactionStatus === "NEW";
            };
        },
        canChangeOrderStatus: function (order) {
            if (order !== undefined) {
                return ["DB ADMIN", "WAREHOUSE MANAGER"].includes(curUser.roleID.toUpperCase()) && order.transactionStatus === "SUBMITTED";
            };
        },
        canDeleteOrder: function (order) {
            if (order !== undefined) {
                return ["DB ADMIN", "STORE MANAGER", "WAREHOUSE MANAGER"].includes(curUser.roleID.toUpperCase()) && order.transactionStatus === "NEW" && ["EMERGENCY", "RETURN", "LOSS", "DAMAGE"].includes(order.transactionType);
            };
        },
        canShowNotes: function (order) {
            if (order !== undefined) {
                return ["LOSS"].includes(order.transactionType);
            };
        },
        canChangeNotes: function (order) {
            if (order !== undefined) {
                return ["NEW"].includes(order.transactionStatus);
            };
        },
        canSubmitLoss: function (order) {
            if (order !== undefined) {
                return ["NEW"].includes(order.transactionStatus) && ["LOSS"].includes(order.transactionType) && ["STORE MANAGER"].includes(curUser.roleID.toUpperCase()) && [order.originalLocationID].includes(curUser.locationID);
            };
        },
        canSubmitReturn: function (order) {
            if (order !== undefined) {
                return ["RETURN", "DAMAGE"].includes(order.transactionType) && ["NEW"].includes(order.transactionStatus) && ["STORE MANAGER"].includes(curUser.roleID.toUpperCase()) && [order.originalLocationID].includes(curUser.locationID);
            };
        },
        canProcessReturn: function(order) {
            if (order !== undefined) {
                return ["RETURN", "DAMAGE"].includes(order.transactionType) && ["SUMITTED"].includes(order.transactionStatus.toUpperCase()) && ["WAREHOUSE MANAGER", "WAREHOUSE WORKER"].includes(curUser.roleID.toUpperCase());
            };
        },
        changeOrderStatus: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "call changeOrderStatus(?)",
                        types: "i",
                        params: [order.transactionID],
                    }
                })
                .then(function (response) {
                    console.log(response.data);
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        submitOrder: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "call submitOrder(?)",
                        types: "i",
                        params: [order.transactionID],
                    }
                })
                .then(function (response) {
                    console.log(response.data);
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        submitAllOrders: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "call submitAllOrders()",
                    }
                })
                .then(function (response) {
                    if (response.data > 0) {
                        alert("All current week store orders have been submitted");
                    } else {
                        alert("The store orders have already been submitted");
                    };
                    console.log(response);
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        readTransaction: function () {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "select * from transaction order by estimatedArrival desc, transactionID desc"
                    }
                })
                .then(function (response) {
                    tableOrder.orders = response.data;
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        formatDate: function (date) {
            return formatDate(date);
        },
        readOrder: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "select tl.itemID, i.itemName, i.description, i.categoryName, i.costPrice, i.retailPrice, s.companyName, i.caseSize, CEILING(tl.quantity / i.caseSize) as 'caseQuantity', tl.quantity from transactionline tl, item i, supplier s WHERE tl.itemID = i.itemID and i.supplierID = s.supplierID AND tl.transactionID = ?",
                        types: "i",
                        values: [order.transactionID]
                    }
                })
                .then(function (response) {
                    tableOrder.order[1] = response.data;
                    tableOrder.order[0] = order;
                    tableOrder.showFormOrder = true;
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        sort: function (e) {
            const prop = this.header[e.target.innerHTML];
            let res = globalSort(this.orders, prop, this.sortedCat);
            this.sortedCat = res[0];
            this.orders = res[1];
        },
        cancelFormOrder: function () {
            tableOrder.showFormOrder = false;
            tableOrder.order[0] = [];
            tableOrder.order[1] = [];
            tableOrder.action = "";
            console.log("a");
        },
        updateOrderQuantity: function (transactionID, item) {
            if (checkInteger(item.caseQuantity)) {
                if (item.caseQuantity >= 0) {
                    axios
                        .get("/BullsEye/api/mysqli.php", {
                            params: {
                                stmt: "update transactionline set quantity = ? where transactionID = ? and itemID = ?",
                                types: "iii",
                                values: [item.caseQuantity * item.caseSize, transactionID, item.itemID]
                            }
                        })
                        .then(function (response) {})
                        .catch(function (error) {
                            alert(error);
                        });
                }
            };
        },
        createItem: function (order) {
            tableOrder.showFormInventory = true;
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "SELECT i.itemID, i.itemName, i.description, i.categoryName, s.companyName, 0 as caseQuantity, i.caseSize FROM item i, supplier s WHERE s.supplierID = i.supplierID AND i.active = true AND i.itemID NOT IN (SELECT itemID FROM transactionline WHERE transactionID = ?)",
                        types: "i",
                        values: [order.transactionID],
                    }
                })
                .then(function (response) {
                    tableOrder.allItems = response.data;
                    tableOrder.paginationIndexLast = Math.floor(response.data.length / tableOrder.itemsShown) + ((response.data.length % tableOrder.itemsShown) > 0 ? 1 : 0);

                })
                .catch(function (error) {
                    alert(error);
                });
        },
        cancelFormInventory: function () {
            tableOrder.showFormInventory = false;
        },
        readDueDate: function (order) {
            if (order !== undefined) {
                let override = "STATUS_OVERRIDE";
                if (!new RegExp(override.toString(), "i").test(order.notes) && order.transactionStatus === "NEW" && order.transactionType === "ORDER") {
                    let sat = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - new Date().getDay() + 6);
                    return tableOrder.formatDate(sat);
                } else {
                    return "N/A";
                };
            }
        },
        deleteItem: function (order, item) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "call removeItem(?, ?)",
                        types: "ii",
                        values: [order.transactionID, item.itemID]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormOrder = false;
                    tableOrder.readOrder(order);
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        processOrder: function (order) {
            if (order.transactionStatus === "SUBMITTED") {
                axios
                    .get("/BullsEye/api/mysqli.php", {
                        params: {
                            stmt: "UPDATE transaction SET transactionStatus = 'PROCESSING' WHERE transactionID = ?",
                            types: "i",
                            values: [order.transactionID]
                        }
                    })
                    .then(function (response) {
                        tableOrder.readTransaction();
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            } else {
                axios
                    .get("/BullsEye/api/mysqli.php", {
                        params: {
                            stmt: "select tl.itemID, i.itemName, i.description, i.categoryName, i.costPrice, i.retailPrice, s.companyName, i.caseSize, CEILING(tl.quantity / i.caseSize) as 'caseQuantity', tl.quantity from transactionline tl, item i, supplier s WHERE tl.itemID = i.itemID and i.supplierID = s.supplierID AND tl.transactionID = ? AND (?, tl.itemID) NOT IN (SELECT transactionID, itemID FROM processingline)",
                            types: "ii",
                            values: [order.transactionID, order.transactionID]
                        }
                    })
                    .then(function (response) {
                        console.log(response);
                        tableOrder.order[1] = response.data;
                        tableOrder.order[0] = order;
                        tableOrder.showFormOrder = true;
                        tableOrder.action = "PROCESS";
                    })
                    .catch(function (error) {
                        alert(error);
                    });
            };
        },
        processItem: function (order, item) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL processItem(?, ?, ?)",
                        types: "iii",
                        values: [order.transactionID, item.itemID, item.caseSize * item.caseQuantity]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormOrder = false;
                    tableOrder.readTransaction();
                    tableOrder.processOrder(order);
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        processAllItems: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL processAllItems(?)",
                        types: "i",
                        values: [order.transactionID]
                    }
                })
                .then(function (response) {
                    console.log(response);
                    tableOrder.showFormOrder = false;
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        shipOrder: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "select tl.itemID, i.itemName, i.description, i.categoryName, i.costPrice, i.retailPrice, s.companyName, i.caseSize, CEILING(tl.quantity / i.caseSize) as 'caseQuantity', tl.quantity from transactionline tl, item i, supplier s WHERE tl.itemID = i.itemID and i.supplierID = s.supplierID AND tl.transactionID = ? AND (?, tl.itemID) NOT IN (SELECT transactionID, itemID FROM shippingline);",
                        types: "ii",
                        values: [order.transactionID, order.transactionID]
                    }
                })
                .then(function (response) {
                    tableOrder.order[1] = response.data;
                    tableOrder.order[0] = order;
                    tableOrder.showFormOrder = true;
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        shipItem: function (order, item) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL shipItem(?, ?, ?)",
                        types: "iii",
                        values: [order.transactionID, item.itemID, item.caseSize * item.caseQuantity]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormOrder = false;
                    tableOrder.readTransaction();
                    tableOrder.shipOrder(order);
                    if (tableOrder.order[1].length === 0) {
                        tableOrder.showFormSignature = true;
                        signaturePad = new SignaturePad(document.getElementById('signature-pad'), {
                            backgroundColor: 'rgba(255, 255, 255, 0)',
                            penColor: 'rgb(0, 0, 0)'
                        });
                    };
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        shipAllItems: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL shipAllItems(?)",
                        types: "i",
                        values: [order.transactionID]
                    }
                })
                .then(function (response) {
                    console.log(response);
                    tableOrder.showFormOrder = false;
                    tableOrder.readTransaction();
                    tableOrder.showFormSignature = true;
                    signaturePad = new SignaturePad(document.getElementById('signature-pad'), {
                        backgroundColor: 'rgba(255, 255, 255, 0)',
                        penColor: 'rgb(0, 0, 0)'
                    });
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        receiveOrder: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "select tl.itemID, i.itemName, i.description, i.categoryName, i.costPrice, i.retailPrice, s.companyName, i.caseSize, CEILING(tl.quantity / i.caseSize) as 'caseQuantity', tl.quantity from transactionline tl, item i, supplier s WHERE tl.itemID = i.itemID and i.supplierID = s.supplierID AND tl.transactionID = ? AND (?, tl.itemID) NOT IN (SELECT transactionID, itemID FROM receivingline);",
                        types: "ii",
                        values: [order.transactionID, order.transactionID]
                    }
                })
                .then(function (response) {
                    tableOrder.order[1] = response.data;
                    tableOrder.order[0] = order;
                    tableOrder.showFormOrder = true;
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        receiveItem: function (order, item) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL receiveItem(?, ?, ?)",
                        types: "iii",
                        values: [order.transactionID, item.itemID, item.caseSize * item.caseQuantity]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormOrder = false;
                    tableOrder.readTransaction();
                    tableOrder.receiveOrder(order);
                    if (tableOrder.order[1].length === 0) {
                        tableOrder.showFormSignature = true;
                        signaturePad = new SignaturePad(document.getElementById('signature-pad'), {
                            backgroundColor: 'rgba(255, 255, 255, 0)',
                            penColor: 'rgb(0, 0, 0)'
                        });
                    };
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        receiveAllItems: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL receiveAllItems(?)",
                        types: "i",
                        values: [order.transactionID]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormOrder = false;
                    tableOrder.readTransaction();
                    tableOrder.showFormSignature = true;
                    signaturePad = new SignaturePad(document.getElementById('signature-pad'), {
                        backgroundColor: 'rgba(255, 255, 255, 0)',
                        penColor: 'rgb(0, 0, 0)'
                    });
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        addItemToTxn: function (i) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "INSERT INTO transactionline (transactionID, itemID, quantity) VALUES (?, ?, ?)",
                        types: "iii",
                        values: [tableOrder.order[0].transactionID, i.itemID, i.caseQuantity * i.caseSize]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormInventory = false;
                    tableOrder.showFormOrder = false;
                    tableOrder.readOrder(tableOrder.order[0]);
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        createEmergencyOrder: function () {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL createEmergencyOrder(?)",
                        types: "s",
                        values: [curUser.locationID]
                    }
                })
                .then(function (response) {
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        submitFormEmergencyAll: function () {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL createEmergencyOrder(?)",
                        types: "s",
                        values: [tableOrder.emergencyLocationID]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormEmergencyAll = false;
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        cancelFormEmergencyAll: function () {
            tableOrder.showFormEmergencyAll = false;
        },
        readBackorder: function () {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "select i.itemID, i.itemName, i.description, inv.quantity, SUM(tl.quantity) as 'orderQuantity' FROM item i, inventory inv, transactionline tl WHERE i.itemID = inv.itemID AND tl.itemID = i.itemID AND inv.locationID = 'WARE' AND tl.transactionID IN (SELECT transactionID FROM transaction WHERE transactionstatus = 'SUBMITTED' AND transactionType = 'ORDER') GROUP BY i.itemID HAVING sum(tl.quantity) > inv.quantity",
                        types: null,
                        values: [null]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormBackorder = true;
                    tableOrder.backorder = response.data;
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        cancelFormBackorder: function () {
            tableOrder.showFormBackorder = false;
        },
        modifyQuantity: function (itemID, quantity) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "select tl.transactionID, t.originalLocationID, 0 as newQuantity, tl.quantity FROM transactionline tl, transaction t WHERE tl.itemID = ? AND t.transactionID = tl.transactionID",
                        types: "i",
                        values: [itemID]
                    }
                })
                .then(function (response) {
                    tableOrder.backorderTxn[0] = quantity;
                    tableOrder.backorderTxn[1] = response.data;
                    tableOrder.backorderTxn[2] = itemID;
                    tableOrder.showFormQuantity = true;
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        cancelFormQuantity: function () {
            tableOrder.showFormQuantity = false;
            tableOrder.readTransaction();
        },
        autoModifyQuantity: function () {
            let sum = 0;
            let remainder = 0;
            let txns = tableOrder.backorderTxn[1];
            for (let i = 0; i < txns.length; i++) {
                sum += txns[i].quantity;
            };
            for (let i = 0; i < txns.length - 1; i++) {
                txns[i].newQuantity = Math.round(txns[i].quantity / sum * tableOrder.backorderTxn[0]);
                remainder += txns[i].newQuantity;
            };
            txns[txns.length - 1].newQuantity = tableOrder.backorderTxn[0] - remainder;
            tableOrder.backorderTxn[1] = txns;
            tableOrder.showFormQuantity = false;
            tableOrder.showFormQuantity = true;
        },
        submitFormQuantity: function () {
            let txns = tableOrder.backorderTxn[1];
            let sum = 0;
            for (let i = 0; i < txns.length; i++) {
                sum += txns[i].newQuantity;
            };
            if (sum !== tableOrder.backorderTxn[0]) {
                alert("The sum of allocated quantities must be the same as the amount in warehouse");
            } else {
                for (let i = 0; i < tableOrder.backorderTxn[1].length; i++) {
                    axios
                        .get("/BullsEye/api/mysqli.php", {
                            params: {
                                stmt: "CALL modifyQuantity(?, ?, ?, ?)",
                                types: "iiii",
                                values: [tableOrder.backorderTxn[1][i].quantity, tableOrder.backorderTxn[1][i].newQuantity, tableOrder.backorderTxn[1][i].transactionID, tableOrder.backorderTxn[2]]
                            }
                        })
                        .then(function (response) {
                            tableOrder.showFormBackorder = false;
                            tableOrder.showFormQuantity = false;
                            tableOrder.readTransaction();
                        })
                        .catch(function (error) {
                            alert(error);
                        });
                };
            };
        },
        createLossOrder: function () {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL createReturnOrder(?, ?)",
                        types: "ss",
                        values: ["LOSS", curUser.locationID]
                    }
                })
                .then(function (response) {
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        createReturnOrder: function () {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL createReturnOrder(?, ?)",
                        types: "ss",
                        values: ["RETURN", curUser.locationID]
                    }
                })
                .then(function (response) {
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        createDamageOrder: function () {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL createReturnOrder(?, ?)",
                        types: "ss",
                        values: ["DAMAGE", curUser.locationID]
                    }
                })
                .then(function (response) {})
                .catch(function (error) {
                    alert(error);
                });
        },
        submitFormSignature: function () {
            if (signaturePad.isEmpty()) {
                alert("Signature needed");
            } else {
                tableOrder.showFormSignature = false;
                signaturePad.clear();
            };
        },
        clearFormSignature: function () {
            signaturePad.clear();
        },
        submitLoss: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL submitLoss(?, ?)",
                        types: "is",
                        values: [order.transactionID, tableOrder.notes]
                    }
                })
                .then(function (response) {
                    console.log(response);
                    console.log(tableOrder.notes);
                    tableOrder.showFormOrder = false;
                    tableOrder.notes = "";
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        submitReturn: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL submitReturn(?)",
                        types: "i",
                        values: [order.transactionID]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormOrder = false;
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        processReturn: function(order) {
            axios
            .get("/BullsEye/api/mysqli.php", {
                params: {
                    stmt: "UPDATE transaction SET status = 'COMPLETE' WHERE transactionID = ?",
                    types: "is",
                    values: [order.transactionID]
                }
            })
            .then(function (response) {
                tableOrder.showFormOrder = false;
                tableOrder.readTransaction();
            })
            .catch(function (error) {
                alert(error);
            });   
        },
        createStorePurchase: function() {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "INSERT INTO transaction (transactionType, originalLocationID, creationDate, estimatedArrival, transactionStatus, notes) VALUES ('SALE', ?, NOW(), NULL, 'NEW', '')",
                        types: "s",
                        values: [curUser.locationID]
                    }
                })
                .then(function (response) {
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        createStoreReturn: function() {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "INSERT INTO transaction (transactionType, originalLocationID, creationDate, estimatedArrival, transactionStatus, notes) VALUES ('RETURN', ?, NOW(), NULL, 'NEW', '')",
                        types: "s",
                        values: [curUser.locationID]
                    }
                })
                .then(function (response) {
                    tableOrder.readTransaction();
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        cancelFormPurchase: function() {
            tableOrder.showFormPurchase = false;
        },
        readPurchase: function (order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "select tl.itemID, i.itemName, i.description, i.categoryName, i.costPrice, i.retailPrice, s.companyName, tl.quantity from transactionline tl, item i, supplier s WHERE tl.itemID = i.itemID and i.supplierID = s.supplierID AND tl.transactionID = ?",
                        types: "i",
                        values: [order.transactionID]
                    }
                })
                .then(function (response) {
                    tableOrder.order[1] = response.data;
                    tableOrder.order[0] = order;
                    tableOrder.showFormPurchase = true;
                })
                .catch(function (error) {
                    alert(error);
                });
        },
        updatePurchaseQuantity: function (transactionID, item) {
            if (checkInteger(item.quantity)) {
                if (item.quantity >= 0) {
                    axios
                        .get("/BullsEye/api/mysqli.php", {
                            params: {
                                stmt: "update transactionline set quantity = ? where transactionID = ? and itemID = ?",
                                types: "iii",
                                values: [item.quantity, transactionID, item.itemID]
                            }
                        })
                        .then(function (response) {})
                        .catch(function (error) {
                            alert(error);
                        });
                }
            };
        },
        completeFormPurchase: function(order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL completePurchaseOrder(?)",
                        types: "i",
                        values: [order.transactionID]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormPurchase = false;
                })
                .catch(function (error) {
                    alert(error);
                });            
        },
        completeFormReturn: function(order) {
            axios
                .get("/BullsEye/api/mysqli.php", {
                    params: {
                        stmt: "CALL completeReturnOrder(?)",
                        types: "i",
                        values: [order.transactionID]
                    }
                })
                .then(function (response) {
                    tableOrder.showFormPurchase = false;
                })
                .catch(function (error) {
                    alert(error);
                });            
        },
    },
});