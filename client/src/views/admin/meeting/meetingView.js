import { CloseIcon, DeleteIcon, EditIcon, ViewIcon } from "@chakra-ui/icons"
import {
    DrawerFooter,
    Flex,
    Grid,
    GridItem,
    IconButton,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Text,
} from "@chakra-ui/react"
import { useEffect, useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getApi } from "services/api"
import { HasAccess } from "../../../redux/accessUtils"
import Spinner from "components/spinner/Spinner"
import moment from "moment"

const MeetingView = ({ onClose, isOpen, info, fetchData, setAction, action, access }) => {
    const [data, setData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const [contactAccess, leadAccess] = HasAccess(["Contacts", "Leads"])
    const meetingId = info?.event?.id || info
    const fetchController = useRef(null)

    useEffect(() => {
        if (!isOpen || !meetingId) {
            setData(null)
            return
        }

        const fetchViewData = async () => {
            if (fetchController.current) {
                fetchController.current.abort()
            }
            fetchController.current = new AbortController()

            setIsLoading(true)
            try {
                const result = await getApi(`api/meeting/view/${meetingId}`, {
                    signal: fetchController.current.signal,
                })
                setData(result?.data)
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Error fetching meeting data:", error)
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchViewData()

        return () => {
            if (fetchController.current) {
                fetchController.current.abort()
            }
        }
    }, [isOpen, meetingId])

    const handleViewOpen = () => {
        navigate(`/view/${meetingId}`)
    }

    const renderAttendees = () => {
        if (!data) return "-"

        const attendees = data.related === "Contact" ? data.attendes : data.attendesLead
        const accessCheck = data.related === "Contact" ? contactAccess : leadAccess

        if (!attendees) return "-"

        return attendees.map((item) => {
            const name = data.related === "Contact" ? `${item.firstName} ${item.lastName}` : item.leadName
            const link = data.related === "Contact" ? `/contactView/${item._id}` : `/leadView/${item._id}`

            if (accessCheck?.view) {
                return (
                    <Link key={item._id} to={link}>
                        <Text color="brand.600" sx={{ "&:hover": { color: "blue.500", textDecoration: "underline" } }}>
                            {name}
                        </Text>
                    </Link>
                )
            }

            return (
                <Text key={item._id} color="blackAlpha.900">
                    {name}
                </Text>
            )
        })
    }

    return (
        <Modal isOpen={isOpen} size="md" isCentered>
            <ModalOverlay />
            <ModalContent height="70%">
                <ModalHeader justifyContent="space-between" display="flex">
                    Meeting
                    <IconButton onClick={() => onClose(false)} icon={<CloseIcon />} />
                </ModalHeader>
                {isLoading ? (
                    <Flex justifyContent="center" alignItems="center" mb={30} width="100%">
                        <Spinner />
                    </Flex>
                ) : (
                    <>
                        <ModalBody overflowY="auto">
                            <Grid templateColumns="repeat(12, 1fr)" gap={3}>
                                <GridItem colSpan={{ base: 12, md: 6 }}>
                                    <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                        Agenda
                                    </Text>
                                    <Text>{data?.agenda || "-"}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }}>
                                    <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                        Date & Time
                                    </Text>
                                    <Text>{data?.dateTime ? moment(data.dateTime).format("lll") : "-"}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }}>
                                    <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                        Created By
                                    </Text>
                                    <Text>{data?.createdByName || "-"}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }}>
                                    <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                        Related
                                    </Text>
                                    <Text>{data?.related || "-"}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }}>
                                    <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                        Location
                                    </Text>
                                    <Text>{data?.location || "-"}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }}>
                                    <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                        Notes
                                    </Text>
                                    <Text>{data?.notes || "-"}</Text>
                                </GridItem>
                                <GridItem colSpan={{ base: 12, md: 6 }}>
                                    <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                        Attendees
                                    </Text>
                                    {renderAttendees()}
                                </GridItem>
                            </Grid>
                        </ModalBody>
                        <DrawerFooter>
                            {access?.view && (
                                <IconButton
                                    variant="outline"
                                    colorScheme="green"
                                    onClick={handleViewOpen}
                                    borderRadius="10px"
                                    size="md"
                                    icon={<ViewIcon />}
                                />
                            )}
                            {access?.update && (
                                <IconButton
                                    variant="outline"
                                    onClick={() => setAction("edit")}
                                    ml={3}
                                    borderRadius="10px"
                                    size="md"
                                    icon={<EditIcon />}
                                />
                            )}
                            {access?.delete && (
                                <IconButton
                                    colorScheme="red"
                                    onClick={() => setAction("delete")}
                                    ml={3}
                                    borderRadius="10px"
                                    size="md"
                                    icon={<DeleteIcon />}
                                />
                            )}
                        </DrawerFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

export default MeetingView
