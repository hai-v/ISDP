<?php
$servername = "localhost";
$username = "haivu";
$password = "haivu";
$dbname = "bullseye";

$con = mysqli_connect($servername, $username, $password, $dbname);

if (!$con) {
	die("Connection failed: " . mysqli_connect_error());
}
?>