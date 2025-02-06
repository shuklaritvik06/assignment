import { Box, Button, Flex, Grid, GridItem, Heading, Text } from "@chakra-ui/react"
import { DeleteIcon } from "@chakra-ui/icons"
import { HSeparator } from "components/separator/Separator"
import { useEffect, useState } from "react"
import { IoIosArrowBack } from "react-icons/io"
import { FaFilePdf } from "react-icons/fa"
import { Link, useNavigate, useParams } from "react-router-dom"
import { HasAccess } from "../../../redux/accessUtils"
import { getApi, deleteApi } from "services/api"
import Card from "components/card/Card"
import Spinner from "components/spinner/Spinner"
import CommonDeleteModel from "components/commonDeleteModel"
import moment from "moment"
import html2pdf from "html2pdf.js"

const View = () => {
    const [data, setData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isPdfLoading, setIsPdfLoading] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const navigate = useNavigate()
    const params = useParams()
    const user = JSON.parse(localStorage.getItem("user"))

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const response = await getApi("api/meeting/view/", params.id)
            setData(response?.data)
        } catch (error) {
            console.error("Error fetching meeting data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [params.id])

    const generatePDF = () => {
        setIsPdfLoading(true)
        const element = document.getElementById("reports")
        const hideBtn = document.getElementById("hide-btn")
        if (element && hideBtn) {
            hideBtn.style.display = "none"
            html2pdf()
                .from(element)
                .set({
                    margin: [0, 0, 0, 0],
                    filename: `Meeting_Details_${moment().format("DD-MM-YYYY")}.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
                    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
                })
                .save()
                .then(() => {
                    setIsPdfLoading(false)
                    hideBtn.style.display = ""
                })
        } else {
            console.error("Element with ID 'reports' or 'hide-btn' not found.")
            setIsPdfLoading(false)
        }
    }

    const handleDeleteMeeting = async () => {
        setIsLoading(true)
        try {
            const response = await deleteApi("api/meeting/delete/", params.id)
            if (response.status === 200) {
                setIsDeleteModalOpen(false)
                navigate(-1)
            }
        } catch (error) {
            console.error("Error deleting meeting:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const [permission, contactAccess, leadAccess] = HasAccess(["Meetings", "Contacts", "Leads"])

    const renderAttendees = () => {
        if (data?.related === "Contact" && contactAccess?.view) {
            return data.attendes?.map((item) => (
                <Link key={item._id} to={`/contactView/${item._id}`}>
                    <Text color="brand.600" sx={{ "&:hover": { color: "blue.500", textDecoration: "underline" } }}>
                        {`${item.firstName} ${item.lastName}`}
                    </Text>
                </Link>
            ))
        } else if (data?.related === "Lead" && leadAccess?.view) {
            return data.attendesLead?.map((item) => (
                <Link key={item._id} to={`/leadView/${item._id}`}>
                    <Text color="brand.600" sx={{ "&:hover": { color: "blue.500", textDecoration: "underline" } }}>
                        {item.leadName}
                    </Text>
                </Link>
            ))
        } else if (data?.related === "contact") {
            return data.attendes?.map((item) => (
                <Text key={item._id} color="blackAlpha.900">{`${item.firstName} ${item.lastName}`}</Text>
            ))
        } else if (data?.related === "lead") {
            return data.attendesLead?.map((item) => (
                <Text key={item._id} color="blackAlpha.900">
                    {item.leadName}
                </Text>
            ))
        }
        return "-"
    }

    if (isLoading) {
        return (
            <Flex justifyContent="center" alignItems="center" width="100%">
                <Spinner />
            </Flex>
        )
    }

    return (
        <>
            <Grid templateColumns="repeat(4, 1fr)" gap={3} id="reports">
                <GridItem colSpan={{ base: 4 }}>
                    <Heading size="lg" m={3}>
                        {data?.agenda || ""}
                    </Heading>
                </GridItem>
                <GridItem colSpan={{ base: 4 }}>
                    <Card>
                        <Grid gap={4}>
                            <GridItem colSpan={2}>
                                <Box>
                                    <Flex justifyContent="space-between">
                                        <Heading size="md" mb={3}>
                                            Meeting Details
                                        </Heading>
                                        <Box id="hide-btn">
                                            <Button
                                                leftIcon={<FaFilePdf />}
                                                size="sm"
                                                variant="brand"
                                                onClick={generatePDF}
                                                disabled={isPdfLoading}
                                            >
                                                {isPdfLoading ? "Please Wait..." : "Print as PDF"}
                                            </Button>
                                            <Button
                                                leftIcon={<IoIosArrowBack />}
                                                size="sm"
                                                variant="brand"
                                                onClick={() => navigate(-1)}
                                                style={{ marginLeft: 10 }}
                                            >
                                                Back
                                            </Button>
                                        </Box>
                                    </Flex>
                                    <HSeparator />
                                </Box>
                            </GridItem>
                            <GridItem colSpan={{ base: 2, md: 1 }}>
                                <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                    Agenda
                                </Text>
                                <Text>{data?.agenda || "-"}</Text>
                            </GridItem>
                            <GridItem colSpan={{ base: 2, md: 1 }}>
                                <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                    Created By
                                </Text>
                                <Text>{data?.createdByName || "-"}</Text>
                            </GridItem>
                            <GridItem colSpan={{ base: 2, md: 1 }}>
                                <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                    DateTime
                                </Text>
                                <Text>
                                    {data?.dateTime
                                        ? `${moment(data.dateTime).format("DD-MM-YYYY h:mma")} [${moment(data.dateTime).toNow()}]`
                                        : "-"}
                                </Text>
                            </GridItem>
                            <GridItem colSpan={{ base: 2, md: 1 }}>
                                <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                    Timestamp
                                </Text>
                                <Text>
                                    {data?.timestamp
                                        ? `${moment(data.timestamp).format("DD-MM-YYYY h:mma")} [${moment(data.timestamp).toNow()}]`
                                        : "-"}
                                </Text>
                            </GridItem>
                            <GridItem colSpan={{ base: 2, md: 1 }}>
                                <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                    Location
                                </Text>
                                <Text>{data?.location || "-"}</Text>
                            </GridItem>
                            <GridItem colSpan={{ base: 2, md: 1 }}>
                                <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                    Notes
                                </Text>
                                <Text>{data?.notes || "-"}</Text>
                            </GridItem>
                            <GridItem colSpan={{ base: 2, md: 1 }}>
                                <Text fontSize="sm" fontWeight="bold" color="blackAlpha.900">
                                    Attendees
                                </Text>
                                {renderAttendees()}
                            </GridItem>
                        </Grid>
                    </Card>
                </GridItem>
            </Grid>
            {(user.role === "superAdmin" || permission?.update || permission?.delete) && (
                <Card mt={3}>
                    <Grid templateColumns="repeat(6, 1fr)" gap={1}>
                        <GridItem colStart={6}>
                            <Flex justifyContent="right">
                                {(user.role === "superAdmin" || permission?.delete) && (
                                    <Button
                                        size="sm"
                                        style={{ background: "red.800" }}
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        leftIcon={<DeleteIcon />}
                                        colorScheme="red"
                                    >
                                        Delete
                                    </Button>
                                )}
                            </Flex>
                        </GridItem>
                    </Grid>
                </Card>
            )}
            <CommonDeleteModel
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                type="Meetings"
                handleDeleteData={handleDeleteMeeting}
                ids={params.id}
            />
        </>
    )
}

export default View
