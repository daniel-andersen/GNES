import Engine from './engine/engine'

/*import * as Phaser from 'phaser'

const gameConfig = {
    title: 'GNES',
    type: Phaser.AUTO,
    scale: {
        width: window.innerWidth,
        height: window.innerHeight,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
        },
    },
    parent: 'game',
    backgroundColor: '#000000',
}

export const game = new Phaser.Game(gameConfig)*/

const engine = new Engine()
engine.run(["/assets/tests/test.basic"])
