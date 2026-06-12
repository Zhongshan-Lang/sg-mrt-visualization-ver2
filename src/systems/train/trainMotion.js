const DECEL = 0.006
const ACCEL = 0.006
const MIN_BRAKE_SPEED = 0.0003
const STOP_SNAP_DISTANCE = 0.0005
const SLOW_APPROACH_DISTANCE = 0.002
const BRAKE_BUFFER = 0.008

export function normalizeLoopState(train, stations, isLoop) {
    if (!isLoop) return

    const routeLen = train.route.length
    if (train.distance > routeLen) {
        train.distance -= routeLen
        train.currentStationIndex = 0
    } else if (train.distance < 0) {
        train.distance += routeLen
        train.currentStationIndex = stations.length - 1
    }
}

export function ensureCurrentStationIndex(train) {
    if (train.currentStationIndex === undefined) {
        train.currentStationIndex = 0
    }
}

export function updateWaitTimer(train, dt) {
    if (train.waitTimer <= 0) return false

    train.waitTimer -= dt
    if (train.waitTimer <= 0) {
        train.waitTimer = 0
    }

    return true
}

export function getTargetStationIndex(train, stations, isLoop) {
    let targetIndex = train.currentStationIndex + train.direction

    if (isLoop) {
        if (targetIndex >= stations.length) {
            targetIndex = 0
        } else if (targetIndex < 0) {
            targetIndex = stations.length - 1
        }
        return targetIndex
    }

    if (targetIndex >= stations.length) {
        train.direction = -1
        train._braking = false
        targetIndex = train.currentStationIndex - 1
    }

    if (targetIndex < 0) {
        train.direction = 1
        train._braking = false
        targetIndex = train.currentStationIndex + 1
    }

    return targetIndex
}

export function advanceTrainTowardStation(train, targetStation, dt) {
    const remain = Math.abs(targetStation.distance - train.distance)
    const brakingDistance = (train.speed * train.speed) / (2 * DECEL) + BRAKE_BUFFER

    if (remain < brakingDistance) {
        train._braking = true

        if (remain < SLOW_APPROACH_DISTANCE) {
            train.speed = remain * 0.5
        } else {
            train.speed -= DECEL * dt
            if (train.speed < MIN_BRAKE_SPEED) {
                train.speed = MIN_BRAKE_SPEED
            }
        }
    } else if (!train._braking) {
        train.speed += ACCEL * dt
        if (train.speed > train.targetSpeed) {
            train.speed = train.targetSpeed
        }
    }

    train.distance += train.speed * train.direction * dt

    if (remain < STOP_SNAP_DISTANCE) {
        train.distance = targetStation.distance
        train.speed = 0
        train._braking = false
        return true
    }

    return false
}
