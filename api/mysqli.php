<?php
include $_SERVER['DOCUMENT_ROOT'] . "/BullsEye/db/config.php";

$stmt = $con->prepare($_GET['stmt']);
if (isset($_GET['types'])) {
	$stmt->bind_param($_GET['types'], ...$_GET['values']);
}

$stmt->execute();

$data = $stmt->get_result();

if (is_bool($data)) {
	echo $con->affected_rows;
}
else {
	$res = array();
	while($row = mysqli_fetch_assoc($data)) {
		$res[] = $row;
	}
	echo json_encode($res);
	mysqli_free_result($data);
}

mysqli_close($con);
?>