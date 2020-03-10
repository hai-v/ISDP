//Name: checkPermission
//Input: array of string
//Output: boolean
//Description: based on class level variable "permissions" that contains the list of actions an user can do, retrun true if action keywords are in the array
function checkPermission(keywords) {
	return permissions.find(p => keywords.includes(p.actionID)) !== undefined;
};

//Name: checkInteger
//Input: String
//Output: boolean
//Description: Return true if input is an interger
function checkInteger(num) {
	let valid = true;
	if (isNaN(num)) {
		valid = false;
	} else {
		if (isNaN(parseInt(num))) {
			valid = false;
		}
	}
	return valid;
};

//Name: checkFloat
//Input: String
//Output: boolean
//Description: Return true if input is a floating number
function checkFloat(num) {
	let valid = true;
	if (isNaN(num)) {
		valid = false;
	} else {
		if (isNaN(parseFloat(num))) {
			valid = false;
		}
	}
	return valid;
};

//Name: checkPostalCode
//Input: String
//Output: boolean
//Description: Return true if input is a valid Canadian postal code
function checkPostalCode(input) {
	return new RegExp(/^([A-Z]\d){3}$/).test(input);
};

//Name: checkEmail
//Input: String
//Output: boolean
//Description: Return true if input is a valid email. The email can contains numbers, letters, underscore, dot, dash. There can't be two or more consecutives special characters. Tld cannot start with a dot.
function checkEmail(input) {
	return new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(input);
};

//Name: checkNotEmptyString
//Input: String
//Output: boolean
//Description: Return true if input is not an empty string
function checkNotEmptyString(input) {
	return new RegExp(/\S/).test(input);
};

//Name: checkPassword
//Input: String
//Output: boolean
//Description: Return true if input fulfills these requirements: at least one uppercase letter, at least one number, at least 8 characters in length
function checkPassword(input) {
	return new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/).test(input);
};

//Name: checkPhoneNumber
//Input: String
//Output: boolean
//Description: Return true if input is a valid phone number
function checkPhoneNumber(input) {
	return new RegExp(/^\d{3}-\d{3}-\d{4}$/).test(input);
};

//Name: filterRow
//Input: string/number/boolean, string
//Output: boolean
//Description: check if the test contains the entered regex ***change the variable later to make it easier to understand
function filterRow(regex, test) {
	return new RegExp(regex.toString(), "i").test(test);
};

function formatDate(date) {
	let d = new Date(date);
	d.setHours(d.getHours() + 4);
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return date === null ? null : d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
};

//Name: globalSort
//Input: array of objects, string, string
//Output: an mixed array of string and an array of objects
//Description: Based on the column that has been clicked to sort, the algorithm would sort the array of objects based on the selected property of said object. 
function globalSort(inArr, prop, sortedCat) {
	let newArr = inArr;
	if (sortedCat == "" || sortedCat != prop) {
		newArr.sort(function (a, b) {
			let x = a[prop] === undefined ? "" : a[prop].toString().toLowerCase();
			let y = b[prop] === undefined ? "" : b[prop].toString().toLowerCase();
			if (x < y) {
				return -1;
			}
			if (x > y) {
				return 1;
			}
			return 0;
		});
		sortedCat = prop;
	} else {
		newArr.reverse();
	}
	return [sortedCat, newArr];
};