<?

$f = json_decode(file_get_contents("full.json"));

$p = $o = 0;
foreach ($f->paper as $c => $t) {
$p += $t;
}
$l = "2013-09-10";
foreach ($f->eci->$l as $c => $t) {
$o  += $t;
}

die ("papier $p online $o");
?>
