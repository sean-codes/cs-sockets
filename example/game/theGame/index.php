<!DOCTYPE html>
<html>
	<head>
		<title>Cube-Script</title>
		<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no">
		<link rel="stylesheet" type="text/css" href="css.css?v=1" />

		<!-- Compile Game Engine -->
		<?php include(dirname(__FILE__) . DIRECTORY_SEPARATOR . "cscript" . DIRECTORY_SEPARATOR . "scr_load.php"); ?>

	</head> 
	<body>
		<!--Game Area-->
		<div id="view"></div>
		
		<script>
			cs.init('view');
			cs.global.networkControl = { id: -1, list: {} }
			cs.network.connect({ port:9999, ssl: false });
			cs.obj.create('obj_player', 40, 40);
			
			var tx = 0;
			while(tx < cs.room.width){
				cs.obj.create('obj_block', tx, cs.room.height-16);
				tx += 16;
			}
		</script>
	</body>
</html>
