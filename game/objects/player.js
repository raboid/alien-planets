'use strict';

function Player(game, hud, x, y) {
	this.game = game;
	this.hud = hud;

	Phaser.Sprite.call(this, game, x, y, 'aliens', 'greenStand.png');
	game.add.existing(this);

	game.camera.follow(this);

	game.physics.arcade.enable(this);
	this.body.fixedRotation = true;
	this.body.collideWorldBounds = true;

	this.anchor.setTo(0.5,0.5);

	this.facing = 'right';

	this.speed = 240;

	this.jumpPower = -420;
	this.jumpDelay = 500;
	this.jumpCount = 0;

	this.sprintPower = 10;
	this.sprintDelay = 1500;
	this.sprinting = false;

	this.hurt = false;
	this.hurtTimer = 0;
	this.hurtDelay = 400;

	this.abilityDelay = 8000;

	this.aliens = ['green', 'blue', 'pink', 'tan'];
	this.alien = 'green';
	this.action = 'Stand';

	this.gameOver = false;

	for(var alien in this.aliens) {
		var a = this.aliens[alien];
		this.animations.add(a + 'Stand', [a + 'Stand.png'], 10, false, false);
		this.animations.add(a + 'Jump', [a + 'Jump.png'], 10, false, false);
		this.animations.add(a + 'Hurt', [a + 'Hurt.png'], 5, false, false);
		this.animations.add(a + 'Walk', [a + 'Walk1.png', a + 'Walk2.png'], 7, true, false);
	}

	this.animations.add('greenSprint', ['greenWalk1.png', 'greenWalk2.png'], 11, true, false);

	this.heartsMax = {
		'green': 3,
		'blue': 5,
		'pink': 2,
		'tan': 3
	};
	this.hearts = {
		'green': this.heartsMax['green'],
		'blue': this.heartsMax['blue'],
		'pink': this.heartsMax['pink'],
		'tan': this.heartsMax['tan']
	}

	this.hud.updateHearts(this.hearts[this.alien], this.heartsMax[this.alien]);

	this.controls = {
		jump: Phaser.Keyboard.W,
		ability: Phaser.Keyboard.SPACEBAR,
		left: Phaser.Keyboard.A,
		right: Phaser.Keyboard.D,
	}
	for(var control in this.controls) {
		var key = this.controls[control];
		this.game.input.keyboard.addKeyCapture(key);
		this.controls[control] = this.game.input.keyboard.addKey(key);
	}
};

Player.prototype = Object.create(Phaser.Sprite.prototype);  
Player.prototype.constructor = Player;

Player.prototype.update = function() {
	if(this.gameOver) {
		return;
	}
	if(this.hurt) {
		this.hurtTimer++;
		if(this.game.time.now > this.hurtTimer) {
			this.hurt = false;
		}
		return;
	}
	if(this.body.onFloor()) {
		this.jumpCount = 0;
	}
	if(this.controls.jump.isDown) {
		this.jump();
	}
	else if(this.controls.left.isDown) {
		if(this.facing == 'right') {
			this.scale.x *= -1;
			this.facing = 'left';
		}
		if(this.body.velocity.y == 0) {
			this.action = 'Walk';
		}
		if(!this.sprinting) {
			this.body.velocity.x = -this.speed;
		}
	}		
	else if(this.controls.right.isDown) {
		if(this.facing == 'left') {
			this.scale.x *= -1;
			this.facing = 'right';
		}
		if(this.body.velocity.y == 0) {
			this.action = 'Walk';
		}
		if(!this.sprinting) {
			this.body.velocity.x = this.speed;
		}
	} 
	else if(!this.sprinting) {
		this.body.velocity.x = 0;
		if(this.body.velocity.y == 0) {
			this.action = 'Stand';
		}
	}

	if(this.controls.ability.isDown && this.hud.abilityBarCharged) {
		this.ability();
	}

	if(this.sprinting) {
		this.sprintTimer++;
		if(this.game.time.now < this.sprintTimer) {
			this.sprint();
		}
		else {
			this.sprinting = false;
		}
	}
	this.updateAnimations();
};

Player.prototype.jump = function() {
	if((this.game.time.now < this.jumpTimer) || this.jumpCount > 2) {
		return;
	}
	this.body.velocity.y = this.jumpPower;
	this.action = 'Jump';
	this.jumpTimer = this.game.time.now + this.jumpDelay;
	this.jumpCount++;
	if(this.alien == 'green') {
		this.doubleJump();
	}
};

Player.prototype.updateAnimations = function() {
	this.animations.play(this.alien + this.action);
};

Player.prototype.updateAliens = function(alien) {
	this.alien = alien;
	this.hud.updateHearts(this.hearts[this.alien], this.heartsMax[this.alien]);
};

Player.prototype.damage = function(damage) {
	this.action = 'Hurt';
	this.hurt = true;
	this.hurtTimer = this.game.time.now + this.hurtDelay;
	if(damage > this.hearts[this.alien]) {
		this.hearts[this.alien] = 0;
	}
	else if(this.hearts[this.alien] > 0) {
		this.hearts[this.alien] -= damage;
	}
	this.updateAnimations();
	this.hud.updateHearts(this.hearts[this.alien], this.heartsMax[this.alien]);
};

Player.prototype.ability = function() {
	if(this.alien == 'green') {
		return;
	}
	this.hud.drainAbilityBar(this.abilityDelay);
	if(this.alien == 'blue') {
		this.sprinting = true;
		this.sprintTimer = this.game.time.now + this.sprintDelay;
	}
	else if(this.alien == 'pink') {
		this.love();
	}
	else if(this.alien == 'tan') {
		this.teleport();
	}
};

Player.prototype.sprint = function() {
	this.action = 'Sprint';
	if(this.facing == 'right') {
		this.body.velocity.x += this.sprintPower;
	}
	else {
		this.body.velocity.x -= this.sprintPower;
	}
};

Player.prototype.doubleJump = function() {
	if(this.doubleJumped) {
		return;
	} 
	this.jumpCount++;
	this.jump();
};

Player.prototype.love = function() {

};

Player.prototype.teleport = function() {
	this.x = this.game.input.activePointer.worldX;
	this.y = this.game.input.activePointer.worldY;
};

module.exports = Player;