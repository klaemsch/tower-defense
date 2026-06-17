TODO List
- dont store stuff in configs, use config to initialise, then move everything into private fields and access it like that
- update phaser to Phaser 4: https://phaser.io/download/release/v4.1.0
- remove usage of sqrt
- use a enemy pool that initialises enemies before game start and in peace times so it does not stutter when spawning enemies

Done
- dont try to find the closest enemy every tick, only when new structures are placed (use timestamps in structureMap or something)
- remove unnessecary //console.log()
- move distance calculation and find closest X into helper functions
